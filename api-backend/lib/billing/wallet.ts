/**
 * Per-user wallet — credits, plan tier, trial state (issue #10).
 *
 * Provider-cost math is centralized here so the executor can call
 * `wallet.charge(userId, run)` without knowing per-model prices.
 *
 * The storage adapter is pluggable; production wires up Firestore.
 */

export type PlanTier = 'free' | 'trial' | 'pro' | 'enterprise';

export interface Wallet {
  userId: string;
  planTier: PlanTier;
  creditsRemaining: number;
  creditsTotal: number;
  /** Monthly reset anchor (ms epoch). Free + Pro tiers reset; Trial doesn't. */
  resetAt: number | null;
  /** Trial start. Null if user never started a trial. */
  trialStartedAt: number | null;
  /** Trial end. Trial expires unconditionally at this timestamp. */
  trialEndsAt: number | null;
  /** Stripe customer id once a payment method is attached. */
  stripeCustomerId: string | null;
  updatedAt: number;
}

export interface WalletStorage {
  get(userId: string): Promise<Wallet | null>;
  put(wallet: Wallet): Promise<void>;
}

export class MemoryWalletStorage implements WalletStorage {
  private store = new Map<string, Wallet>();
  async get(userId: string): Promise<Wallet | null> {
    return this.store.get(userId) ?? null;
  }
  async put(w: Wallet): Promise<void> {
    this.store.set(w.userId, w);
  }
}

const TIER_GRANTS: Record<PlanTier, { credits: number; resets: boolean }> = {
  free: { credits: 100, resets: true },
  trial: { credits: 1000, resets: false },
  pro: { credits: 10_000, resets: true },
  enterprise: { credits: Number.POSITIVE_INFINITY, resets: false },
};

const TRIAL_DURATION_MS = 7 * 24 * 60 * 60 * 1000;
const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

// Provider price card — kept in code on purpose so it ships with the deploy
// that priced runs. Swap to a config doc when prices change frequently.
type ProviderModel = `${string}/${string}`;
const PRICE_PER_1K_TOKENS: Record<ProviderModel, { in: number; out: number }> = {
  'anthropic/claude-opus-4': { in: 0.015, out: 0.075 },
  'anthropic/claude-sonnet-4-6': { in: 0.003, out: 0.015 },
  'anthropic/claude-haiku-4-5': { in: 0.00025, out: 0.00125 },
  'openai/gpt-4-turbo': { in: 0.01, out: 0.03 },
  'openai/gpt-4o': { in: 0.0025, out: 0.01 },
  'groq/llama-3.3-70b': { in: 0.0005, out: 0.0008 },
};

export interface RunCost {
  /** USD billed to the wallet. */
  usd: number;
  /** Equivalent credit count (1 credit = $0.001 by default). */
  credits: number;
}

export function priceRun(provider: string, model: string, tokensIn: number, tokensOut: number): RunCost {
  const key = `${provider}/${model}` as ProviderModel;
  const price = PRICE_PER_1K_TOKENS[key];
  if (!price) {
    // Unknown model → treat as 1 credit per call. Avoid free path.
    return { usd: 0.001, credits: 1 };
  }
  const usd = (tokensIn / 1000) * price.in + (tokensOut / 1000) * price.out;
  const credits = Math.max(1, Math.ceil(usd * 1000));
  return { usd, credits };
}

export class WalletService {
  constructor(private storage: WalletStorage = new MemoryWalletStorage()) {}

  async getOrCreate(userId: string): Promise<Wallet> {
    const existing = await this.storage.get(userId);
    if (existing) return this.maybeReset(existing);

    const grant = TIER_GRANTS.free;
    const wallet: Wallet = {
      userId,
      planTier: 'free',
      creditsRemaining: grant.credits,
      creditsTotal: grant.credits,
      resetAt: Date.now() + ONE_MONTH_MS,
      trialStartedAt: null,
      trialEndsAt: null,
      stripeCustomerId: null,
      updatedAt: Date.now(),
    };
    await this.storage.put(wallet);
    return wallet;
  }

  async startTrial(userId: string): Promise<Wallet> {
    const w = await this.getOrCreate(userId);
    if (w.trialStartedAt) {
      throw new Error('Trial already used.');
    }
    const grant = TIER_GRANTS.trial;
    const updated: Wallet = {
      ...w,
      planTier: 'trial',
      creditsRemaining: grant.credits,
      creditsTotal: grant.credits,
      resetAt: null,
      trialStartedAt: Date.now(),
      trialEndsAt: Date.now() + TRIAL_DURATION_MS,
      updatedAt: Date.now(),
    };
    await this.storage.put(updated);
    return updated;
  }

  async charge(userId: string, cost: RunCost): Promise<{ ok: true; wallet: Wallet } | { ok: false; reason: 'insufficient_credits' | 'trial_expired'; wallet: Wallet }> {
    let w = await this.getOrCreate(userId);
    w = this.maybeExpireTrial(w);
    w = await this.maybeReset(w);

    if (w.planTier === 'enterprise') {
      // No metering — track cost for reporting but don't decrement.
      return { ok: true, wallet: w };
    }
    if (w.creditsRemaining < cost.credits) {
      return { ok: false, reason: 'insufficient_credits', wallet: w };
    }
    const updated: Wallet = {
      ...w,
      creditsRemaining: w.creditsRemaining - cost.credits,
      updatedAt: Date.now(),
    };
    await this.storage.put(updated);
    return { ok: true, wallet: updated };
  }

  private maybeExpireTrial(w: Wallet): Wallet {
    if (w.planTier === 'trial' && w.trialEndsAt && Date.now() > w.trialEndsAt) {
      return { ...w, planTier: 'free', creditsRemaining: 0, updatedAt: Date.now() };
    }
    return w;
  }

  private async maybeReset(w: Wallet): Promise<Wallet> {
    if (!w.resetAt || Date.now() < w.resetAt) return w;
    const grant = TIER_GRANTS[w.planTier];
    if (!grant.resets) return w;
    const updated: Wallet = {
      ...w,
      creditsRemaining: grant.credits,
      resetAt: Date.now() + ONE_MONTH_MS,
      updatedAt: Date.now(),
    };
    await this.storage.put(updated);
    return updated;
  }

  async setPlan(userId: string, tier: PlanTier, stripeCustomerId?: string): Promise<Wallet> {
    const w = await this.getOrCreate(userId);
    const grant = TIER_GRANTS[tier];
    const updated: Wallet = {
      ...w,
      planTier: tier,
      creditsRemaining: Math.max(w.creditsRemaining, grant.credits),
      creditsTotal: grant.credits,
      resetAt: grant.resets ? Date.now() + ONE_MONTH_MS : null,
      stripeCustomerId: stripeCustomerId ?? w.stripeCustomerId,
      updatedAt: Date.now(),
    };
    await this.storage.put(updated);
    return updated;
  }
}
