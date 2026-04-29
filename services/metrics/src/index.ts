/**
 * Metrics Service — campaign performance aggregation.
 *
 * Polls each platform's analytics API on a schedule, normalizes the metrics,
 * and updates per-variant counters. Drives the Reinforcement Loop in the
 * campaign service.
 */

export interface PlatformMetrics {
  postId: string;
  platform: string;
  impressions: number;
  views: number;
  watchTimeSeconds: number;
  /** 0..1 retention (avg watch / video duration). */
  retention: number;
  likes: number;
  shares: number;
  comments: number;
  saves: number;
  /** Click-through rate to landing page (if tracked). 0..1. */
  ctr: number;
  /** Conversions attributed to the post (if tracked). */
  conversions: number;
  fetchedAt: number;
}

export interface MetricsPort {
  /** Fetch latest metrics for a single post. */
  fetch(postId: string): Promise<PlatformMetrics>;
}

export interface MetricsRepository {
  save(metrics: PlatformMetrics): Promise<void>;
  /** Most recent snapshot per post. */
  latest(postId: string): Promise<PlatformMetrics | null>;
  /** Time series for a post — most recent first. */
  history(postId: string, limit?: number): Promise<PlatformMetrics[]>;
}

export class MetricsAggregator {
  private adapters = new Map<string, MetricsPort>();

  register(platform: string, adapter: MetricsPort): void {
    this.adapters.set(platform, adapter);
  }

  /** Pull latest metrics for every (platform, postId) pair and persist. */
  async refresh(
    posts: Array<{ platform: string; postId: string }>,
    repo: MetricsRepository,
  ): Promise<{ updated: number; failed: number }> {
    let updated = 0;
    let failed = 0;
    await Promise.all(
      posts.map(async ({ platform, postId }) => {
        const adapter = this.adapters.get(platform);
        if (!adapter) return;
        try {
          const m = await adapter.fetch(postId);
          await repo.save(m);
          updated += 1;
        } catch {
          failed += 1;
        }
      }),
    );
    return { updated, failed };
  }
}
