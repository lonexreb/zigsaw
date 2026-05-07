// Storyboard service — calls the Zigsaw api-backend route at /api/v1/storyboard
// which wraps OpenAI's gpt-image-1 with the Arcads-style 12-frame template.

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export type StoryboardStyle = 'cinematic' | 'animated' | 'sketch';

export interface StoryboardRequest {
  prompt: string;
  use_template?: boolean;
  frame_count?: number;
  style?: StoryboardStyle;
  aspect_ratio?: string;
}

export interface StoryboardResponse {
  image_url: string;
  prompt: string;
  original_prompt: string;
  use_template: boolean;
  frame_count: number;
  style: StoryboardStyle;
  aspect_ratio: string;
  timestamp: string;
}

export const storyboardService = {
  async generateStoryboard(request: StoryboardRequest): Promise<StoryboardResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/storyboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      let message = `Storyboard generation failed: ${response.status}`;
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
