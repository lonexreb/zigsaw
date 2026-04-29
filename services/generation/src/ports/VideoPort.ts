/**
 * VideoPort — abstraction for any text-to-video generator (Veo3, Sora, Runway).
 * Adapters live under `adapters/video/`. Hexagonal pattern matches LLMPort.
 */

export interface VideoGenerationOptions {
  /** Aspect ratio. Defaults to 9:16 for short-form. */
  aspect?: '9:16' | '1:1' | '16:9';
  /** Duration cap in seconds. */
  durationSec?: number;
  /** 0..1; higher is more variation between samples. */
  variation?: number;
  /** Seed for reproducibility. */
  seed?: number;
  /** Optional reference image for style/identity conditioning. */
  referenceImageUrl?: string;
}

export interface VideoGenerationResult {
  /** Stable id of the generation job. */
  id: string;
  /** Public URL once the job completes. */
  videoUrl: string;
  /** Provider-reported model + version. */
  model: string;
  /** Realized duration. */
  durationSec: number;
  /** Cost in USD. */
  costUsd: number;
}

export interface VideoPort {
  generate(prompt: string, options?: VideoGenerationOptions): Promise<VideoGenerationResult>;
  /** Optional batch path — generate N variations in parallel. */
  generateBatch?(prompt: string, count: number, options?: VideoGenerationOptions): Promise<VideoGenerationResult[]>;
}
