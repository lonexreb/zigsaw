const API_BASE = 'http://localhost:8000/api';

export interface Veo3Request {
  prompt: string;
  enhance_prompt?: boolean;
  negative_prompt?: string;
  seed?: number;
}

export interface Veo3Response {
  video_url: string;
}

export const veo3Service = {
  async generateVideo(request: Veo3Request): Promise<Veo3Response> {
    const response = await fetch(`${API_BASE}/veo3/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Video generation failed: ${error}`);
    }

    return response.json();
  }
};