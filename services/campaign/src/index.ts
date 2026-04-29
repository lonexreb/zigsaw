/**
 * Campaign Service — orchestrates the AI ad creative loop.
 *
 *   brief + product images
 *        │
 *        ▼
 *   ComposePrompt × N variations
 *        │
 *        ▼
 *   VideoPort.generateBatch
 *        │
 *        ▼
 *   ApprovalGate (optional human-in-the-loop)
 *        │
 *        ▼
 *   PublishingService.fanOut
 *        │
 *        ▼
 *   MetricsService aggregates per-variant CTR / retention
 *        │
 *        ▼
 *   ReinforcementLoop — winners feed next-gen prompts
 */

export interface Campaign {
  id: string;
  name: string;
  status: 'draft' | 'generating' | 'review' | 'publishing' | 'live' | 'completed' | 'paused';
  brief: string;
  productImageUrls: string[];
  /** Number of video variants to produce per generation cohort. */
  cohortSize: number;
  /** Platforms this campaign publishes to. */
  platforms: string[];
  /** Auto-publish without human approval. */
  autoApprove: boolean;
  budgetUsd: number;
  spentUsd: number;
  createdAt: number;
  updatedAt: number;
}

export interface Variant {
  id: string;
  campaignId: string;
  generation: number;
  prompt: string;
  videoUrl: string;
  status: 'generated' | 'approved' | 'rejected' | 'published' | 'losing' | 'winning';
  /** Posts created on each platform — keyed by platform id. */
  posts: Record<string, { postId: string; url: string }>;
  metrics: {
    impressions: number;
    views: number;
    ctr: number;
    retention: number;
    conversions: number;
  };
}

export interface CampaignRepository {
  save(c: Campaign): Promise<void>;
  get(id: string): Promise<Campaign | null>;
  list(filter?: { status?: Campaign['status'] }): Promise<Campaign[]>;
}

export interface VariantRepository {
  save(v: Variant): Promise<void>;
  list(campaignId: string, filter?: { generation?: number; status?: Variant['status'] }): Promise<Variant[]>;
}

/** Pick the top-K winners from a generation cohort by composite score. */
export function selectWinners(variants: Variant[], k: number): Variant[] {
  return [...variants]
    .map((v) => ({ v, score: scoreVariant(v) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, k)
    .map(({ v }) => v);
}

function scoreVariant(v: Variant): number {
  const { ctr, retention, conversions, impressions } = v.metrics;
  if (impressions < 100) return -1; // not enough signal
  // Composite — CTR weighted, retention weighted, conversion bonus.
  return ctr * 0.5 + retention * 0.3 + (conversions / Math.max(1, impressions)) * 0.2;
}
