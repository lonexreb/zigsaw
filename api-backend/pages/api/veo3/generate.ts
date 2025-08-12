import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';

export interface Veo3GenerateRequest {
  enhanced_json?: any;              // Enhanced JSON specification from PromptEnhancementNode
  prompt?: string;                  // Fallback simple text prompt
  model?: string;                   // veo-3.0-generate-preview or veo-3.0-fast-generate-preview
}

export interface Veo3GenerateResponse {
  success: boolean;
  video_url?: string;
  video_blob?: string;              // Base64 encoded video for download
  error?: string;
  metadata?: {
    prompt: string;
    model: string;
    duration: string;
    timestamp: string;
  };
}

// Convert enhanced JSON to natural language prompt for Veo 3
function convertJsonToPrompt(enhancedJson: any): string {
  if (!enhancedJson) return '';
  
  const {
    shot = {},
    subject = {},
    setting = {},
    action = {},
    style = {},
    camera = {},
    audio = {},
    cinematic_controls = {}
  } = enhancedJson;

  let prompt = '';
  
  // Camera shot and framing
  if (shot.type) {
    prompt += `${shot.type}`;
  }
  if (shot.framing) {
    prompt += `, ${shot.framing}`;
  }
  
  // Subject
  if (subject.identity) {
    prompt += ` of ${subject.identity}`;
  }
  if (subject.appearance) {
    prompt += ` with ${subject.appearance}`;
  }
  if (subject.wardrobe) {
    prompt += `, ${subject.wardrobe}`;
  }
  
  // Setting and location
  if (setting.location) {
    prompt += ` in ${setting.location}`;
  }
  if (setting.time_of_day) {
    prompt += `, ${setting.time_of_day}`;
  }
  if (setting.weather) {
    prompt += `, ${setting.weather}`;
  }
  
  // Action and performance
  if (action.performance) {
    prompt += `. ${action.performance}`;
  }
  if (action.blocking) {
    prompt += `, ${action.blocking}`;
  }
  
  // Style and mood
  if (style.mood) {
    prompt += `. ${style.mood} aesthetic`;
  }
  if (style.genre) {
    prompt += `, ${style.genre} style`;
  }
  
  // Camera movement
  if (camera.movement) {
    prompt += `. ${camera.movement}`;
  }
  if (camera.focus) {
    prompt += `, ${camera.focus}`;
  }
  
  // Audio elements
  if (audio.music) {
    prompt += `. ${audio.music}`;
  }
  if (audio.ambience && audio.ambience.length > 0) {
    prompt += `, ${audio.ambience.join(', ')}`;
  }
  
  // Cinematic controls
  if (cinematic_controls.pacing) {
    prompt += `. ${cinematic_controls.pacing}`;
  }
  
  // Clean up the prompt
  prompt = prompt.replace(/^[,\\s]+/, ''); // Remove leading commas/spaces
  prompt = prompt.replace(/\\s+/g, ' '); // Normalize spaces
  prompt = prompt.trim();
  
  // Add Instagram optimization
  if (enhancedJson.platform_target === 'instagram_reel_9x16') {
    prompt += '. Optimized for Instagram Reels, 9:16 aspect ratio, engaging and dynamic for social media.';
  }
  
  return prompt;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Veo3GenerateResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed. Use POST.'
    });
  }

  try {
    const { enhanced_json, prompt, model = 'veo-3.0-fast-generate-preview' }: Veo3GenerateRequest = req.body;

    // Get API key from environment
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({
        success: false,
        error: 'Google AI API key not configured on server'
      });
    }

    // Convert enhanced JSON to prompt if provided
    let finalPrompt = prompt || '';
    if (enhanced_json) {
      finalPrompt = convertJsonToPrompt(enhanced_json);
      if (!finalPrompt) {
        return res.status(400).json({
          success: false,
          error: 'Failed to convert enhanced JSON to prompt'
        });
      }
    }

    if (!finalPrompt.trim()) {
      return res.status(400).json({
        success: false,
        error: 'No prompt provided for video generation'
      });
    }

    console.log(`🎬 Starting Veo 3 video generation (${model}):`);
    console.log(`📝 Prompt: ${finalPrompt}`);

    // Initialize Google AI client
    const ai = new GoogleGenAI({
      apiKey: apiKey
    });

    // Start video generation
    let operation = await ai.models.generateVideos({
      model: model,
      prompt: finalPrompt,
    });

    // Poll the operation status until the video is ready
    let pollCount = 0;
    const maxPolls = 60; // Max 10 minutes (10s intervals)
    
    while (!operation.done && pollCount < maxPolls) {
      console.log(`⏳ Video generation in progress... (${pollCount + 1}/${maxPolls})`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      operation = await ai.operations.getVideosOperation({
        operation: operation,
      });
      
      pollCount++;
    }

    if (!operation.done) {
      return res.status(408).json({
        success: false,
        error: 'Video generation timed out after 10 minutes'
      });
    }

    if (operation.error) {
      console.error('❌ Veo 3 generation error:', operation.error);
      return res.status(500).json({
        success: false,
        error: `Video generation failed: ${operation.error.message || 'Unknown error'}`
      });
    }

    // Get the generated video
    const generatedVideo = operation.response.generatedVideos[0];
    if (!generatedVideo || !generatedVideo.video) {
      return res.status(500).json({
        success: false,
        error: 'No video was generated in the response'
      });
    }

    // Convert video bytes to base64 for transfer
    const videoBytes = generatedVideo.video.videoBytes;
    const videoBase64 = Buffer.from(videoBytes).toString('base64');

    console.log('✅ Veo 3 video generation completed successfully');

    return res.status(200).json({
      success: true,
      video_blob: videoBase64,
      metadata: {
        prompt: finalPrompt,
        model: model,
        duration: '8 seconds',
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('❌ Veo 3 API error:', error);
    return res.status(500).json({
      success: false,
      error: `Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}
