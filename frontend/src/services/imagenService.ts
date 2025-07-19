const API_BASE = 'http://localhost:8000/api';

export interface ImagenRequest {
  prompt: string;
  aspect_ratio?: string;
  safety_filter_level?: string;
  output_format?: string;
}

export interface ImagenResponse {
  image_url: string;
  prompt: string;
  aspect_ratio: string;
  safety_filter_level: string;
  output_format: string;
}

export const imagenService = {
  async generateImage(request: ImagenRequest): Promise<ImagenResponse> {
    const response = await fetch(`${API_BASE}/imagen/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Image generation failed: ${error}`);
    }

    return response.json();
  }
};