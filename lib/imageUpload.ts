import { supabase } from './supabase';
import { scoreFood } from './healthScoring';

interface UploadResult {
  success: boolean;
  data?: {
    imageUrl: string;
    imagePath: string;
    postId?: string;
    healthScore?: number;
    reasoning?: string;
  };
  error?: string;
}

/**
 * Generate a unique filename for uploaded images
 */
export function generateUniqueFilename(originalExtension: string = 'jpg'): string {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 8);
  return `food_${timestamp}_${randomString}.${originalExtension}`;
}

/**
 * Upload image to Supabase Storage with retry logic
 */
export async function uploadImageToStorage(
  imageUri: string,
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: string = '';

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`Upload attempt ${attempt}/${maxRetries}...`);

      // Generate unique filename
      const filename = generateUniqueFilename();
      const filePath = `food-photos/${filename}`;

      // Convert image URI to blob for upload
      let fileBlob: Blob;
      
      if (imageUri.startsWith('data:')) {
        // Handle base64 data URIs (web)
        const response = await fetch(imageUri);
        fileBlob = await response.blob();
      } else {
        // Handle file URIs (mobile)
        const response = await fetch(imageUri);
        fileBlob = await response.blob();
      }

      console.log('File blob created, size:', fileBlob.size);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('food-photos')
        .upload(filePath, fileBlob, {
          contentType: 'image/jpeg',
          duplex: 'half'
        });

      if (error) {
        console.error(`Upload attempt ${attempt} failed:`, error);
        lastError = error.message;
        
        // If it's the last attempt, return the error
        if (attempt === maxRetries) {
          return {
            success: false,
            error: `Upload failed after ${maxRetries} attempts: ${lastError}`
          };
        }
        
        // Wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        continue;
      }

      if (data) {
        console.log('Upload successful:', data);

        // Get public URL for the uploaded image
        const { data: urlData } = supabase.storage
          .from('food-photos')
          .getPublicUrl(filePath);

        if (urlData?.publicUrl) {
          return {
            success: true,
            data: {
              imageUrl: urlData.publicUrl,
              imagePath: filePath
            }
          };
        } else {
          lastError = 'Failed to get public URL for uploaded image';
        }
      } else {
        lastError = 'Upload returned no data';
      }

    } catch (error) {
      console.error(`Upload attempt ${attempt} error:`, error);
      lastError = error instanceof Error ? error.message : 'Unknown upload error';
      
      // If it's the last attempt, return the error
      if (attempt === maxRetries) {
        return {
          success: false,
          error: `Upload failed after ${maxRetries} attempts: ${lastError}`
        };
      }
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
    }
  }

  return {
    success: false,
    error: `Upload failed after ${maxRetries} attempts: ${lastError}`
  };
}

/**
 * Create a post record in the database after successful upload
 */
export async function createPostRecord(imageUrl: string, imagePath: string): Promise<UploadResult> {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Create post record
    const { data, error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        image_url: imageUrl,
        image_path: imagePath,
        // health_score will be added later by the scoring system
      })
      .select()
      .single();

    if (error) {
      console.error('Database insert error:', error);
      return {
        success: false,
        error: `Failed to create post record: ${error.message}`
      };
    }

    console.log('Post record created:', data);
    return {
      success: true,
      data: {
        imageUrl,
        imagePath,
        postId: data.id
      }
    };

  } catch (error) {
    console.error('Create post error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    };
  }
}

/**
 * Complete upload flow: upload image + create post record + trigger AI scoring
 */
export async function uploadImageAndCreatePost(
  imageUri: string, 
  onScoringComplete?: (score: number, reasoning: string) => void
): Promise<UploadResult> {
  console.log('Starting complete upload flow...');

  // Step 1: Upload image to storage
  const uploadResult = await uploadImageToStorage(imageUri);
  
  if (!uploadResult.success || !uploadResult.data) {
    return uploadResult;
  }

  console.log('Image uploaded successfully, creating post record...');

  // Step 2: Create post record in database
  const postResult = await createPostRecord(
    uploadResult.data.imageUrl, 
    uploadResult.data.imagePath
  );

  if (!postResult.success) {
    // TODO: Consider cleaning up the uploaded image if post creation fails
    console.warn('Post creation failed, but image was uploaded to:', uploadResult.data.imagePath);
    return postResult;
  }

  console.log('Post created successfully, triggering AI scoring...');

  // Step 3: Trigger AI scoring (non-blocking - runs in background)
  if (postResult.data && postResult.data.postId) {
    const postId = postResult.data.postId;
    console.log(`🚀 [IMAGE-UPLOAD] Starting AI scoring for post ${postId}`);
    
    // Trigger scoring asynchronously - don't wait for it to complete
    scoreFood(uploadResult.data.imageUrl, postId)
      .then((scoringResult) => {
        if (scoringResult.success) {
          console.log(`✅ [IMAGE-UPLOAD] AI scoring completed: ${scoringResult.score}/10`);
          // Call the callback to update UI
          if (onScoringComplete && scoringResult.score && scoringResult.reasoning) {
            onScoringComplete(scoringResult.score, scoringResult.reasoning);
          }
        } else {
          console.error(`❌ [IMAGE-UPLOAD] AI scoring failed: ${scoringResult.error}`);
        }
      })
      .catch((error) => {
        console.error(`❌ [IMAGE-UPLOAD] AI scoring error:`, error);
      });
  } else {
    console.warn(`⚠️ [IMAGE-UPLOAD] No postId available for AI scoring`);
  }

  // Return immediately after upload and post creation (don't wait for scoring)
  return {
    success: true,
    data: {
      imageUrl: uploadResult.data.imageUrl,
      imagePath: uploadResult.data.imagePath,
      postId: postResult.data?.postId
    }
  };
}