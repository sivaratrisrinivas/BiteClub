// Type declarations for Deno environment
declare global {
  const Deno: {
    env: {
      get(key: string): string | undefined;
    };
  };
}

/// <reference types="https://esm.sh/@supabase/functions-js/src/edge-runtime.d.ts" />

// @ts-ignore: External module for Deno environment
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.24.0';
// @ts-ignore: External module for Deno environment
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

interface FoodScoringRequest {
  imageUrl: string;
  postId: string;
}

interface ScoringResult {
  score: number;
  reasoning: string;
  confidence: number;
  model?: string;
  analysisTime?: number;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Gemini AI
const geminiApiKey = Deno.env.get('GOOGLE_AI_API_KEY');
if (!geminiApiKey) {
  console.error('GOOGLE_AI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(geminiApiKey || '');

/**
 * Convert image URL to base64 for Gemini processing
 */
async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  try {
    console.log(`🔍 [IMAGE-FETCH] Fetching image from: ${imageUrl}`);
    
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }
    
    // Get image as array buffer first
    const arrayBuffer = await response.arrayBuffer();
    console.log(`✅ [IMAGE-FETCH] Image downloaded, size: ${arrayBuffer.byteLength} bytes`);
    
    // Convert to Uint8Array then to base64
    const uint8Array = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000; // 32KB chunks to avoid stack overflow
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.subarray(i, i + chunkSize);
      binary += String.fromCharCode.apply(null, Array.from(chunk));
    }
    
    const base64 = btoa(binary);
    console.log(`✅ [IMAGE-FETCH] Image converted to base64, size: ${base64.length} characters`);
    return base64;
  } catch (error) {
    console.error(`❌ [IMAGE-FETCH] Error fetching image:`, error);
    throw error instanceof Error ? error : new Error(String(error));
  }
}

/**
 * Analyze food image using Gemini with retry logic for overloaded API
 */
async function analyzeFood(imageUrl: string): Promise<ScoringResult> {
  const analysisStart = Date.now();
  
  // Retry configuration for API overload
  const MAX_RETRIES = 3;
  const BASE_DELAY = 1000; // 1 second
  
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 [GEMINI] Attempt ${attempt}/${MAX_RETRIES} using model: gemini-1.5-flash-8b`);
      
      // Try different models in order of reliability
      const models = [
        'gemini-1.5-flash-8b',     // Fastest, most available
        'gemini-1.5-flash',        // Standard model
        'gemini-1.0-pro-vision'    // Fallback model
      ];
      
      const modelName = models[Math.min(attempt - 1, models.length - 1)];
      
      const model = genAI.getGenerativeModel({ 
        model: modelName,
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 1000,
        }
      });

      // Fetch image as base64 with timeout
      const imageTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Image fetch timeout')), 15000);
      });

      const imagePromise = fetchImageAsBase64(imageUrl);
      const base64Image = await Promise.race([imagePromise, imageTimeout]) as string;

      // Prepare the content for Gemini
      const imagePart = {
        inlineData: {
          data: base64Image,
          mimeType: "image/jpeg",
        },
      };

      const prompt = `You are a nutrition expert. Analyze this food image and provide a health score from 1-10 where:
      - 10: Extremely healthy (fresh fruits, vegetables, lean proteins, whole grains)
      - 8-9: Very healthy (balanced meals, minimal processing)
      - 6-7: Moderately healthy (some processed ingredients but nutritious)
      - 4-5: Neutral/mixed (equal healthy and unhealthy elements)
      - 2-3: Somewhat unhealthy (high in processed foods, sugar, or fat)
      - 1: Very unhealthy (junk food, heavily processed, high sugar/fat)

      Respond with ONLY a JSON object in this exact format:
      {"score": <number>, "reasoning": "<brief explanation>", "confidence": <1-5>}

      Be decisive and assign a clear score. If it's not food, assign score 5 with appropriate reasoning.`;

      // Call Gemini with timeout
      const geminiTimeout = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Gemini API timeout')), 20000);
      });

      const geminiPromise = model.generateContent([prompt, imagePart]);
      const result = await Promise.race([geminiPromise, geminiTimeout]);

      const response = result.response;
      const text = response.text();

      // Parse JSON response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      
      // Validate response structure
      if (typeof parsed.score !== 'number' || parsed.score < 1 || parsed.score > 10) {
        throw new Error('Invalid score in response');
      }

      const analysisTime = Date.now() - analysisStart;
      console.log(`✅ [GEMINI] Score: ${parsed.score}/10 in ${analysisTime}ms`);

      return {
        score: Math.round(parsed.score),
        reasoning: parsed.reasoning || 'No reasoning provided',
        confidence: parsed.confidence || 3,
        model: modelName,
        analysisTime: analysisTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.log(`❌ [GEMINI] Attempt ${attempt} failed: ${errorMessage}`);
      
      // Check if it's an API overload error
      if (errorMessage.includes('503') || errorMessage.includes('overloaded') || 
          errorMessage.includes('Service Unavailable') || errorMessage.includes('quota')) {
        
        if (attempt < MAX_RETRIES) {
          const delay = BASE_DELAY * Math.pow(2, attempt - 1); // Exponential backoff
          console.log(`⏳ [GEMINI] API overloaded, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue; // Try next attempt
        }
      }
      
      // If not an overload error, or if we've exhausted retries, throw
      if (attempt === MAX_RETRIES) {
        console.log(`❌ [GEMINI] All ${MAX_RETRIES} attempts failed`);
        throw new Error(`Gemini API failed after ${MAX_RETRIES} attempts: ${errorMessage}`);
      }
    }
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected end of retry loop');
}

/**
 * Main function handler
 */
// @ts-ignore: Deno global
Deno.serve(async (req: Request) => {
  const requestStart = Date.now();
  const requestId = `req_${requestStart}_${Math.random().toString(36).substr(2, 9)}`;
  
  console.log(`🚀 [${requestId}] Food scoring request received`);

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let postId: string | undefined; // Declare postId at function scope

  try {
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Parse request body with timeout
    const bodyParseTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Body parsing timeout')), 5000);
    });

    const body: FoodScoringRequest = await Promise.race([
      req.json(),
      bodyParseTimeout
    ]) as FoodScoringRequest;

    const { imageUrl } = body;
    postId = body.postId; // Assign postId from body

    // Validate input
    if (!imageUrl || !postId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'imageUrl and postId are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🍎 [${requestId}] Analyzing post ${postId}`);

    // Score the food using Gemini AI
    const result = await analyzeFood(imageUrl);
    
    // Update the post with the health score
    const updateTimeout = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Database update timeout')), 10000);
    });
    
    const updatePromise = supabase
      .from('posts')
      .update({
        health_score: result.score,
        scoring_details: {
          reasoning: result.reasoning,
          confidence: result.confidence,
          model: result.model || 'gemini-1.5-flash',
          analysis_time: result.analysisTime || 0,
          scored_at: new Date().toISOString()
        }
      })
      .eq('id', postId);

    const { error: updateError } = await Promise.race([updatePromise, updateTimeout]);

    if (updateError) {
      throw updateError;
    }

    console.log(`✅ [${requestId}] Completed in ${Date.now() - requestStart}ms`);
    
    return new Response(
      JSON.stringify({
        success: true,
        score: result.score,
        reasoning: result.reasoning,
        confidence: result.confidence,
        model: result.model,
        analysis_time: result.analysisTime
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const duration = Date.now() - requestStart;
    
    console.error(`❌ [${requestId}] Failed after ${duration}ms: ${errorMessage}`);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
}); 