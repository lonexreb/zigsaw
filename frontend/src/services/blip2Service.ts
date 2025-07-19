const API_BASE = 'http://localhost:8000/api';

export interface Blip2Request {
  image_url: string;
  question?: string;
  context?: string;
  caption?: boolean;
  use_nucleus_sampling?: boolean;
  temperature?: number;
}

export interface Blip2Response {
  result: string;
  image_url: string;
  question?: string;
  context?: string;
  caption: boolean;
  use_nucleus_sampling: boolean;
  temperature: number;
}

export const blip2Service = {
  async analyzeImage(request: Blip2Request): Promise<Blip2Response> {
    const response = await fetch(`${API_BASE}/blip2/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Image analysis failed: ${error}`);
    }

    return response.json();
  }
};