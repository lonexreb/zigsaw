// Seedance 2 service — calls the Zigsaw api-backend route at
// /api/v1/seedance2 which proxies ByteDance Volcano Engine ARK
// (model: doubao-seedance-1-0-pro-250528) for image-to-video generation.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export interface Seedance2Request {
  prompt: string;
  image_url: string;
  duration?: number;
  resolution?: string;
  aspect_ratio?: string;
}

export interface Seedance2Response {
  video_url: string;
  task_id: string;
  prompt: string;
  image_url: string;
  duration: number;
  resolution: string;
  aspect_ratio: string;
  timestamp: string;
}

export const seedance2Service = {
  async generateVideo(request: Seedance2Request): Promise<Seedance2Response> {
    const response = await fetch(`${API_BASE_URL}/api/v1/seedance2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let message = `Seedance 2 generation failed: ${response.status}`;
      try {
        const errJson = await response.json();
        if (errJson?.details) message = errJson.details;
        else if (errJson?.error) message = errJson.error;
      } catch {
        message = `${message} ${await response.text()}`.trim();
      }
      throw new Error(message);
    }

    return response.json();
  },
};
