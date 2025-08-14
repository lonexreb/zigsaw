import { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenAI } from '@google/genai';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface Veo3GenerateRequest {
  enhanced_json?: any;              // Enhanced JSON specification from PromptEnhancementNode
  prompt?: string;                  // Fallback simple text prompt
  model?: string;                   // veo-3.0-generate-preview (default) or veo-3.0-fast-generate-preview
}

export interface Veo3GenerateResponse {
  success: boolean;
  video_url?: string;
  video_file_path?: string;         // Local file path to downloaded video
  video_file_name?: string;         // Just the filename
  video_blob?: string;              // Base64 encoded video for download (legacy)
  error?: string;
  metadata?: {
    prompt: string;
    model: string;
    duration: string;
    timestamp: string;
    fileSize?: number;
    localPath?: string;
    videoId?: string;
  };
}

// Helper function to get Downloads folder path (cross-platform)
function getDownloadsPath(): string {
  const homeDir = os.homedir();
  return path.join(homeDir, 'Downloads');
}

// Helper function to ensure ZigsawVideos folder exists and is writable
function ensureVideoFolderAccess(): string {
  const downloadsPath = getDownloadsPath();
  const videoFolder = path.join(downloadsPath, 'ZigsawVideos');
  const metadataFolder = path.join(videoFolder, 'metadata');
  
  console.log(`📁 Downloads path: ${downloadsPath}`);
  console.log(`📁 Video folder: ${videoFolder}`);
  
  // Create folders if they don't exist
  if (!fs.existsSync(videoFolder)) {
    console.log(`📁 Creating ZigsawVideos folder...`);
    fs.mkdirSync(videoFolder, { recursive: true });
  }
  
  if (!fs.existsSync(metadataFolder)) {
    console.log(`📁 Creating metadata folder...`);
    fs.mkdirSync(metadataFolder, { recursive: true });
  }
  
  // Test write access
  try {
    const testFile = path.join(videoFolder, '.write_test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log(`✅ Write access confirmed for: ${videoFolder}`);
  } catch (error) {
    throw new Error(`Cannot write to Downloads folder: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  
  return videoFolder;
}

// Helper function to generate safe filename from prompt
function generateSafeFilename(prompt: string): string {
  const timestamp = Date.now();
  const promptSlug = prompt
    .slice(0, 30)
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .replace(/\s+/g, '_')
    .toLowerCase();
  
  return `veo3_video_${timestamp}_${promptSlug}.mp4`;
}

// Helper function to save video metadata
function saveVideoMetadata(videoFolder: string, videoId: string, metadata: any): void {
  const metadataPath = path.join(videoFolder, 'metadata', `${videoId}_metadata.json`);
  
  try {
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
    console.log(`📄 Metadata saved: ${metadataPath}`);
  } catch (error) {
    console.warn(`⚠️ Failed to save metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
    // Don't fail the entire operation if metadata save fails
  }
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
  prompt = prompt.replace(/^[,\s]+/, ''); // Remove leading commas/spaces
  prompt = prompt.replace(/\s+/g, ' '); // Normalize spaces
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
    const { enhanced_json, prompt, model = 'veo-3.0-generate-preview' }: Veo3GenerateRequest = req.body;

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

    // Start video generation with proper error handling
    let operation;
    try {
      operation = await ai.models.generateVideos({
        model: model,
        prompt: finalPrompt,
      });
      console.log(`🎬 Video generation started. Operation: ${operation.name}`);
    } catch (apiError) {
      console.error('❌ Error starting video generation:', apiError);
      if (apiError instanceof Error && apiError.message.includes('JSON')) {
        return res.status(500).json({
          success: false,
          error: 'API response parsing failed - invalid JSON from Google AI'
        });
      }
      throw apiError;
    }

    // Poll the operation status until the video is ready
    let pollCount = 0;
    const maxPolls = 60; // Max 10 minutes (10s intervals)
    
    while (!operation.done && pollCount < maxPolls) {
      console.log(`⏳ Video generation in progress... (${pollCount + 1}/${maxPolls})`);
      await new Promise((resolve) => setTimeout(resolve, 10000)); // Wait 10 seconds
      
      try {
        operation = await ai.operations.getVideosOperation({
          operation: operation,
        });
      } catch (pollError) {
        console.error(`❌ Error polling operation:`, pollError);
        if (pollError instanceof Error && pollError.message.includes('JSON')) {
          return res.status(500).json({
            success: false,
            error: 'Failed to poll video generation status - invalid JSON response'
          });
        }
        throw pollError;
      }
      
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

    // Add comprehensive response structure logging
    console.log('📋 Full operation response structure:', JSON.stringify({
      hasResponse: !!operation.response,
      responseKeys: operation.response ? Object.keys(operation.response) : [],
      hasGeneratedVideos: !!(operation.response && operation.response.generatedVideos),
      videosCount: operation.response && operation.response.generatedVideos ? operation.response.generatedVideos.length : 0
    }, null, 2));

    // Validate response structure step by step
    if (!operation.response) {
      return res.status(500).json({
        success: false,
        error: 'No response object returned from Google AI API'
      });
    }

    if (!operation.response.generatedVideos) {
      return res.status(500).json({
        success: false,
        error: 'No generatedVideos array in API response'
      });
    }

    if (operation.response.generatedVideos.length === 0) {
      return res.status(500).json({
        success: false,
        error: 'Generated videos array is empty'
      });
    }

    // Get the generated video with correct property name (camelCase)
    const generatedVideo = operation.response.generatedVideos[0];
    console.log('🎥 Generated video object keys:', Object.keys(generatedVideo));
    
    if (!generatedVideo || !generatedVideo.video) {
      return res.status(500).json({
        success: false,
        error: 'Generated video object is missing or invalid'
      });
    }

    console.log('📹 Video file object keys:', Object.keys(generatedVideo.video));

    // Download the video to Downloads folder
    let videoFilePath: string;
    let videoFileName: string;
    let videoId: string;
    
    try {
      console.log(`📥 Starting video download to Downloads folder`);
      console.log(`🎥 Video object structure:`, Object.keys(generatedVideo.video));
      
      // Validate video object first
      if (!generatedVideo || !generatedVideo.video) {
        throw new Error('Invalid video object: generatedVideo.video is missing');
      }
      
      console.log(`📹 Video object contents:`, {
        hasUri: !!generatedVideo.video.uri,
        hasVideoBytes: !!generatedVideo.video.videoBytes,
        objectKeys: Object.keys(generatedVideo.video)
      });
      
      // Ensure Downloads folder is accessible
      const videoFolder = ensureVideoFolderAccess();
      
      // Generate safe filename and paths
      videoFileName = generateSafeFilename(finalPrompt);
      videoFilePath = path.join(videoFolder, videoFileName);
      videoId = `veo3_${Date.now()}`;
      
      console.log(`📁 Download target: ${videoFilePath}`);
      
      // Download using Google AI SDK (official method)
      console.log(`⬇️ Starting Google AI download...`);
      
      await ai.files.download({
        file: generatedVideo.video,
        downloadPath: videoFilePath,
      });
      
      // Verify file was created and get stats
      if (!fs.existsSync(videoFilePath)) {
        throw new Error(`Download completed but file not found at: ${videoFilePath}`);
      }
      
      const fileStats = fs.statSync(videoFilePath);
      const fileSizeMB = fileStats.size / (1024 * 1024);
      
      console.log(`✅ Video downloaded successfully:`, {
        path: videoFilePath,
        size: `${fileSizeMB.toFixed(2)} MB`,
        bytes: fileStats.size
      });
      
      // Create metadata object
      const metadata = {
        prompt: finalPrompt,
        model: model,
        timestamp: new Date().toISOString(),
        videoPath: videoFilePath,
        videoFileName: videoFileName,
        fileSize: fileStats.size,
        fileSizeMB: fileSizeMB,
        duration: "8 seconds",
        generatedAt: new Date(),
        videoId: videoId,
        downloadMethod: 'google_ai_sdk'
      };
      
      // Save metadata file
      saveVideoMetadata(videoFolder, videoId, metadata);
      
      console.log(`✅ Video processing complete:`, {
        filePath: videoFilePath,
        fileName: videoFileName,
        fileSize: `${fileSizeMB.toFixed(2)} MB`,
        videoId: videoId
      });
      
    } catch (downloadError) {
      console.error('❌ Video download error:', downloadError);
      return res.status(500).json({
        success: false,
        error: `Failed to download generated video: ${downloadError instanceof Error ? downloadError.message : 'Unknown download error'}`
      });
    }

    console.log('✅ Veo 3 video generation completed successfully');

    // Create file URL for frontend access
    const fileUrl = `file://${videoFilePath}`;
    
    return res.status(200).json({
      success: true,
      video_url: fileUrl,
      video_file_path: videoFilePath,
      video_file_name: videoFileName,
      metadata: {
        prompt: finalPrompt,
        model: model,
        duration: '8 seconds',
        timestamp: new Date().toISOString(),
        fileSize: fs.statSync(videoFilePath).size,
        localPath: videoFilePath,
        videoId: videoId
      }
    });

  } catch (error) {
    console.error('❌ Veo 3 API error:', error);
    
    // Enhanced error handling for different error types
    let errorMessage = 'Unknown error';
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Special handling for JSON parsing errors
      if (error.message.includes('JSON') || error.message.includes('parse')) {
        errorMessage = 'API response parsing failed - Google AI returned invalid JSON';
      }
      
      // Special handling for network errors
      if (error.message.includes('fetch') || error.message.includes('network')) {
        errorMessage = 'Network error connecting to Google AI API';
      }
      
      // Special handling for authentication errors
      if (error.message.includes('auth') || error.message.includes('key')) {
        errorMessage = 'Authentication failed - check Google AI API key';
      }
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else {
      try {
        errorMessage = JSON.stringify(error);
      } catch {
        errorMessage = 'Unknown error object';
      }
    }

    return res.status(500).json({
      success: false,
      error: `Video generation failed: ${errorMessage}`
    });
  }
}
