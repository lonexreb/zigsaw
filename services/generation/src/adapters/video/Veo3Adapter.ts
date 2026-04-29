/**
 * Veo3Adapter — Google AI Veo 3 implementation of VideoPort.
 *
 * Uses the Vertex AI / Google Generative AI text-to-video endpoints.
 * The adapter is a thin shell around the HTTP API; the orchestration
 * (prompt variation, batching, A/B selection) lives in the campaign service.
 */

import type { VideoPort, VideoGenerationOptions, VideoGenerationResult } from '../../ports/VideoPort';

interface Veo3Config {
  /** Google API key with Generative Language access. */
  apiKey: string;
  /** Model id. Defaults to `veo-3.0-generate-preview`. */
  model?: 'veo-3.0-generate-preview' | 'veo-3.0-fast-generate' | string;
  /** Override the API base for testing. */
  apiBase?: string;
}

export class Veo3Adapter implements VideoPort {
  private apiKey: string;
  private model: string;
  private apiBase: string;

  constructor(config: Veo3Config) {
    if (!config.apiKey) throw new Error('Veo3Adapter requires apiKey');
    this.apiKey = config.apiKey;
    this.model = config.model ?? 'veo-3.0-generate-preview';
    this.apiBase = config.apiBase ?? 'https://generativelanguage.googleapis.com/v1beta';
  }

  async generate(prompt: string, options: VideoGenerationOptions = {}): Promise<VideoGenerationResult> {
    const url = `${this.apiBase}/models/${this.model}:generateContent?key=${this.apiKey}`;
    const body = {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        aspectRatio: options.aspect ?? '9:16',
        durationSeconds: options.durationSec ?? 8,
        seed: options.seed,
      },
    };
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Veo3 generation failed: ${res.status} ${res.statusText} :: ${text}`);
    }
    const data = (await res.json()) as {
      candidates?: Array<{ video?: { uri?: string; durationSeconds?: number } }>;
      usageMetadata?: { totalCostUsd?: number };
    };
    const candidate = data.candidates?.[0];
    const videoUrl = candidate?.video?.uri;
    if (!videoUrl) throw new Error('Veo3 returned no video URI');
    return {
      id: cryptoRandomId(),
      videoUrl,
      model: this.model,
      durationSec: candidate?.video?.durationSeconds ?? options.durationSec ?? 8,
      costUsd: data.usageMetadata?.totalCostUsd ?? 0,
    };
  }

  async generateBatch(prompt: string, count: number, options?: VideoGenerationOptions): Promise<VideoGenerationResult[]> {
    // Provider has no native batch endpoint — fan out with seed variations.
    const seed = options?.seed ?? Math.floor(Math.random() * 1_000_000);
    const tasks = Array.from({ length: count }, (_, i) =>
      this.generate(prompt, { ...options, seed: seed + i }),
    );
    return Promise.all(tasks);
  }
}

function cryptoRandomId(): string {
  // 16 hex chars — sufficient for job correlation; not cryptographic.
  const a = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  const b = Math.floor(Math.random() * 0xffffffff).toString(16).padStart(8, '0');
  return `${a}${b}`;
}
