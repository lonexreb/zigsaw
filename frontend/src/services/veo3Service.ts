// Updated Veo3Service to use our Next.js backend API proxy
// This calls our backend endpoint which securely handles Google AI API calls

export interface Veo3Request {
  enhanced_json?: any;              // Enhanced JSON specification from PromptEnhancementNode
  prompt?: string;                  // Fallback simple text prompt
  model?: string;                   // veo-3.0-generate-preview or veo-3.0-fast-generate-preview
}

export interface Veo3Response {
  success: boolean;
  video_url?: string;               // Blob URL for video display
  video_blob?: string;              // Base64 encoded video data
  error?: string;
  metadata?: {
    prompt: string;
    model: string;
    duration: string;
    timestamp: string;
  };
}

export const veo3Service = {
  async generateVideo(request: Veo3Request): Promise<Veo3Response> {
    try {
      console.log('🎬 Calling backend for Veo 3 video generation:', {
        hasEnhancedJson: !!request.enhanced_json,
        hasPrompt: !!request.prompt,
        model: request.model || 'veo-3.0-fast-generate-preview'
      });

      const response = await fetch('/api/veo3/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          enhanced_json: request.enhanced_json,
          prompt: request.prompt,
          model: request.model || 'veo-3.0-fast-generate-preview'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `HTTP error! status: ${response.status}`);
      }

      if (!data.success) {
        throw new Error(data.error || 'Video generation failed');
      }

      // Convert base64 video to blob URL for display
      let videoUrl = '';
      if (data.video_blob) {
        try {
          // Convert base64 to blob
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

      return {
        success: true,
        video_url: videoUrl,
        video_blob: data.video_blob,
        metadata: data.metadata
      };

    } catch (error) {
      console.error('❌ Veo3Service error:', error);
      throw new Error(`Video generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
};