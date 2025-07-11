import { supabase } from './supabase';

interface ScoreResult {
  success: boolean;
  score?: number;
  reasoning?: string;
  confidence?: number;
  error?: string;
}

/**
 * Trigger health scoring for a post
 */
export async function scoreFood(imageUrl: string, postId: string): Promise<ScoreResult> {
  console.log(`🔍 [HEALTH-SCORING] Scoring post ${postId}`);

  try {
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Edge function timeout after 30 seconds')), 30000);
    });

    const scoringPromise = supabase.functions.invoke('score-food', {
      body: {
        imageUrl,
        postId
      }
    });

    // Race between scoring and timeout
    const { data, error } = await Promise.race([scoringPromise, timeoutPromise]) as any;

    if (error) {
      console.error(`❌ [HEALTH-SCORING] Edge function error:`, error);
      return {
        success: false,
        error: `Scoring failed: ${error.message || 'Unknown edge function error'}`
      };
    }

    if (!data) {
      console.error(`❌ [HEALTH-SCORING] No data returned from scoring function`);
      return {
        success: false,
        error: 'No response from scoring system'
      };
    }

    console.log(`✅ [HEALTH-SCORING] Score: ${data.score}/10`);
    console.log(`📝 [HEALTH-SCORING] Reasoning: ${data.reasoning}`);

    if (data.success) {
      return {
        success: true,
        score: data.score,
        reasoning: data.reasoning,
        confidence: data.confidence
      };
    } else {
      console.error(`❌ [HEALTH-SCORING] Scoring failed: ${data.error}`);
      return {
        success: false,
        error: data.error || 'Unknown scoring error'
      };
    }

  } catch (error) {
    console.error(`❌ [HEALTH-SCORING] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get the latest post for a user (to trigger scoring after upload)
 */
export async function getLatestPostForUser(): Promise<{ id: string; image_url: string } | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      console.error(`❌ [GET-LATEST-POST] User not found:`, userError);
      return null;
    }

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('id, image_url, health_score')
      .eq('user_id', user.id)
      .is('health_score', null) // Only get posts that haven't been scored yet
      .order('created_at', { ascending: false })
      .limit(1);

    if (postsError) {
      console.error(`❌ [GET-LATEST-POST] Error fetching latest post:`, postsError);
      return null;
    }

    if (!posts || posts.length === 0) {
      return null;
    }

    return posts[0];

  } catch (error) {
    console.error(`❌ [GET-LATEST-POST] Error:`, error);
    return null;
  }
}

/**
 * Complete scoring flow: get latest post and score it
 */
export async function scoreLatestPost(): Promise<ScoreResult> {
  try {
    const latestPost = await getLatestPostForUser();
    
    if (!latestPost) {
      return {
        success: false,
        error: 'No unscored posts found'
      };
    }

    // Score the food image
    const result = await scoreFood(latestPost.image_url, latestPost.id);
    return result;

  } catch (error) {
    console.error(`❌ [SCORE-LATEST-POST] Error:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get a user's health score for today (sum of all post scores)
 */
export async function getTodayHealthScore(): Promise<{ totalScore: number; postCount: number; averageScore: number }> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user) {
      return { totalScore: 0, postCount: 0, averageScore: 0 };
    }

    // Get today's date range
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const { data: posts, error: postsError } = await supabase
      .from('posts')
      .select('health_score')
      .eq('user_id', user.id)
      .not('health_score', 'is', null)
      .gte('created_at', startOfDay.toISOString())
      .lt('created_at', endOfDay.toISOString());

    if (postsError) {
      console.error(`❌ [TODAY-SCORE] Error:`, postsError);
      return { totalScore: 0, postCount: 0, averageScore: 0 };
    }

    if (!posts || posts.length === 0) {
      return { totalScore: 0, postCount: 0, averageScore: 0 };
    }

    const totalScore = posts.reduce((sum, post) => sum + (post.health_score || 0), 0);
    const postCount = posts.length;
    const averageScore = postCount > 0 ? Math.round((totalScore / postCount) * 10) / 10 : 0;

    console.log(`✅ [TODAY-SCORE] Total: ${totalScore}, Count: ${postCount}, Average: ${averageScore}`);
    return { totalScore, postCount, averageScore };

  } catch (error) {
    console.error(`❌ [TODAY-SCORE] Error:`, error);
    return { totalScore: 0, postCount: 0, averageScore: 0 };
  }
} 