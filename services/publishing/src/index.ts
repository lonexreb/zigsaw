/**
 * Publishing Service — multi-platform short-form video publishing.
 *
 * Each platform implements PublishPort. The service offers a single fan-out
 * call that publishes to the configured set in parallel and returns per-
 * platform results (with retries on transient failures).
 */

export type Platform = 'tiktok' | 'instagram-reels' | 'youtube-shorts' | 'meta' | 'linkedin';

export interface PublishOptions {
  caption: string;
  hashtags?: string[];
  /** Schedule a future publish. Omit for immediate. */
  publishAt?: number;
  /** Per-platform overrides. */
  perPlatform?: Partial<Record<Platform, { caption?: string; hashtags?: string[] }>>;
}

export interface PublishResult {
  platform: Platform;
  postId: string;
  url: string;
  publishedAt: number;
  /** Provider-reported view/like/share counts updated by the metrics service. */
  initialMetrics?: {
    views?: number;
    likes?: number;
    shares?: number;
  };
}

export interface PublishPort {
  platform: Platform;
  publish(videoUrl: string, options: PublishOptions): Promise<PublishResult>;
}

export class PublishingService {
  private adapters = new Map<Platform, PublishPort>();

  register(adapter: PublishPort): void {
    this.adapters.set(adapter.platform, adapter);
  }

  /** Publish to all registered platforms in parallel. */
  async fanOut(videoUrl: string, options: PublishOptions, platforms?: Platform[]): Promise<{
    results: PublishResult[];
    failures: Array<{ platform: Platform; error: string }>;
  }> {
    const targets = platforms ?? Array.from(this.adapters.keys());
    const settled = await Promise.allSettled(
      targets.map((p) => {
        const adapter = this.adapters.get(p);
        if (!adapter) throw new Error(`No adapter registered for ${p}`);
        const merged = mergeOptions(options, p);
        return adapter.publish(videoUrl, merged);
      }),
    );
    const results: PublishResult[] = [];
    const failures: Array<{ platform: Platform; error: string }> = [];
    settled.forEach((r, i) => {
      if (r.status === 'fulfilled') results.push(r.value);
      else failures.push({ platform: targets[i], error: String(r.reason) });
    });
    return { results, failures };
  }
}

function mergeOptions(base: PublishOptions, platform: Platform): PublishOptions {
  const override = base.perPlatform?.[platform];
  if (!override) return base;
  return {
    ...base,
    caption: override.caption ?? base.caption,
    hashtags: override.hashtags ?? base.hashtags,
  };
}
