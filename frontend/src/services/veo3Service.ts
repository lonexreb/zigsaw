// Updated Veo3Service to use our Next.js backend API proxy
// This calls our backend endpoint which securely handles Google AI API calls

export interface Veo3Request {
  enhanced_json?: any;              // Enhanced JSON specification from PromptEnhancementNode
  prompt?: string;                  // Fallback simple text prompt
  model?: string;                   // veo-3.0-generate-preview or veo-3.0-fast-generate-preview
}

export interface Veo3Response {
  success: boolean;
  video_url?: string;               // File URL or HTTP URL for video display
  video_file_path?: string;         // Local file path (for reference)
  video_file_name?: string;         // Just the filename
  video_blob?: string;              // Base64 encoded video data (legacy)
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

export const veo3Service = {
  async generateVideo(request: Veo3Request): Promise<Veo3Response> {
    try {
      console.log('🎬 Calling backend for Veo 3 video generation:', {
        hasEnhancedJson: !!request.enhanced_json,
        hasPrompt: !!request.prompt,
        model: request.model || 'veo-3.0-generate-preview'
      });

      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanced_json: request.enhanced_json,
          prompt: request.prompt,
          model: request.model || 'veo-3.0-generate-preview'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Video generation failed');
      }

      console.log('📹 Video generation response:', {
        hasVideoUrl: !!data.video_url,
        hasFilePath: !!data.video_file_path,
        hasFileName: !!data.video_file_name,
        hasVideoBlob: !!data.video_blob
      });

      // Primary: Use file URL if available
      let videoUrl = data.video_url;
      
      // Fallback: If file URL doesn't work, create HTTP serving URL
      if (data.video_file_path && !videoUrl) {
        videoUrl = `/api/videos/serve?path=${encodeURIComponent(data.video_file_path)}`;
        console.log('🔄 Using HTTP serving fallback:', videoUrl);
      }
      
      // Legacy fallback: Convert base64 to blob URL if available
      if (!videoUrl && data.video_blob) {
        try {
          console.log('🔄 Converting base64 to blob URL as fallback...');
          const binaryString = atob(data.video_blob);
          const bytes = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
          }
          const videoBlob = new Blob([bytes], { type: 'video/mp4' });
          videoUrl = URL.createObjectURL(videoBlob);
          
          console.log('✅ Video blob URL created successfully');
        } catch (blobError) {
          console.error('❌ Failed to create video blob:', blobError);
          throw new Error('Failed to process generated video');
        }
      }

      if (!videoUrl) {
        throw new Error('No video URL available from any method');
      }

      console.log('✅ Final video URL:', videoUrl);

      return {
        success: true,
        video_url: videoUrl,
        video_file_path: data.video_file_path,
        video_file_name: data.video_file_name,
        video_blob: data.video_blob,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('❌ Veo3Service error:', error);
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};