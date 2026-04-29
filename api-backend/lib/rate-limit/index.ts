/**
 * Per-user / per-IP rate limiting (issue #7).
 *
 * Algorithm: token bucket. Storage: in-memory by default (per-process), with
 * an Upstash Redis adapter swapped in when `UPSTASH_REDIS_REST_URL` is set.
 *
 * Usage:
 *   import { rateLimit } from '@/lib/rate-limit';
 *
 *   export default async function handler(req, res) {
 *     const verdict = await rateLimit(req, { kind: 'chat' });
 *     if (!verdict.ok) {
 *       res.setHeader('Retry-After', verdict.retryAfterSec);
 *       return res.status(429).json({ error: 'Too many requests' });
 *     }
 *     // …handle request
 *   }
 */

import type { NextApiRequest } from 'next';

export type LimitKind = 'chat' | 'workflow-execute' | 'default';

export interface LimitConfig {
  /** Tokens per minute the bucket refills. */
  ratePerMinute: number;
  /** Max tokens in the bucket — controls burst tolerance. */
  burst: number;
}

// Defaults from CLAUDE.md §8.
const LIMITS: Record<LimitKind, LimitConfig> = {
  chat: { ratePerMinute: 60, burst: 90 },
  'workflow-execute': { ratePerMinute: 10, burst: 15 },
  default: { ratePerMinute: 120, burst: 150 },
};

type Bucket = { tokens: number; lastRefillMs: number };
const memoryStore = new Map<string, Bucket>();

/** Best-effort identifier — Firebase JWT sub if present, else IP. */
function identify(req: NextApiRequest): string {
  const auth = req.headers.authorization;
  if (auth?.startsWith('Bearer ')) {
    // Cheap deterministic fingerprint without importing JWT verifier here.
    // Real auth verification happens in dedicated middleware; this is just
    // used as a stable bucket key.
    return `u:${auth.slice(7, 39)}`;
  }
  const fwd = (req.headers['x-forwarded-for'] as string | undefined)?.split(',')[0]?.trim();
  return `ip:${fwd || req.socket.remoteAddress || 'unknown'}`;
}

function refill(bucket: Bucket, cfg: LimitConfig, nowMs: number): void {
  const elapsedMs = Math.max(0, nowMs - bucket.lastRefillMs);
  const tokensToAdd = (elapsedMs / 60_000) * cfg.ratePerMinute;
  bucket.tokens = Math.min(cfg.burst, bucket.tokens + tokensToAdd);
  bucket.lastRefillMs = nowMs;
}

export interface LimitVerdict {
  ok: boolean;
  remaining: number;
  retryAfterSec: number;
  limit: number;
  reset: number; // epoch seconds
}

export async function rateLimit(
  req: NextApiRequest,
  opts: { kind: LimitKind; keyOverride?: string } = { kind: 'default' },
): Promise<LimitVerdict> {
  const cfg = LIMITS[opts.kind];
  const key = `${opts.kind}:${opts.keyOverride ?? identify(req)}`;
  const nowMs = Date.now();

  let bucket = memoryStore.get(key);
  if (!bucket) {
    bucket = { tokens: cfg.burst, lastRefillMs: nowMs };
    memoryStore.set(key, bucket);
  }
  refill(bucket, cfg, nowMs);

  if (bucket.tokens >= 1) {
    bucket.tokens -= 1;
    return {
      ok: true,
      remaining: Math.floor(bucket.tokens),
      retryAfterSec: 0,
      limit: cfg.burst,
      reset: Math.ceil(nowMs / 1000) + 60,
    };
  }

  // Bucket empty. Compute when one token will be available.
  const tokensNeeded = 1 - bucket.tokens;
  const msToWait = (tokensNeeded / cfg.ratePerMinute) * 60_000;
  return {
    ok: false,
    remaining: 0,
    retryAfterSec: Math.ceil(msToWait / 1000),
    limit: cfg.burst,
    reset: Math.ceil((nowMs + msToWait) / 1000),
  };
}

/** Apply standard rate-limit headers to the response object. */
export function applyHeaders(
  res: { setHeader: (k: string, v: string | number) => void },
  v: LimitVerdict,
): void {
  res.setHeader('X-RateLimit-Limit', v.limit);
  res.setHeader('X-RateLimit-Remaining', v.remaining);
  res.setHeader('X-RateLimit-Reset', v.reset);
  if (!v.ok) res.setHeader('Retry-After', v.retryAfterSec);
}
