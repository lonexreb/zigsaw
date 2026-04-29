/**
 * Append-only audit log (issue #8).
 *
 * Every sensitive action emits an immutable record. The default storage
 * adapter writes to an in-memory ring; production wires up Firestore where
 * security rules deny client writes — only server-side admin SDK can append.
 *
 * Records are signed with HMAC-SHA256 to detect after-the-fact tampering.
 */

import { createHmac } from 'node:crypto';

export type AuditAction =
  | 'workflow.create'
  | 'workflow.update'
  | 'workflow.delete'
  | 'workflow.deploy'
  | 'workflow.run'
  | 'billing.charge'
  | 'billing.refund'
  | 'billing.plan_change'
  | 'secret.access'
  | 'secret.put'
  | 'secret.delete'
  | 'auth.login'
  | 'auth.logout'
  | 'auth.role_change';

export interface AuditEntry {
  /** Stable ULID; sortable by creation. */
  id: string;
  /** Owner of the resource the action mutated. */
  userId: string;
  /** Who performed the action — usually `userId`, may differ for admin ops. */
  actorId: string;
  action: AuditAction;
  /** Human-readable resource (e.g., 'workflow:abc123', 'secret:user/u1/provider/anthropic'). */
  resource: string;
  before: unknown;
  after: unknown;
  ip: string | null;
  ua: string | null;
  /** ms epoch. */
  ts: number;
  /** HMAC of the canonical entry — populated on append. */
  sig: string;
}

export interface AuditStorage {
  append(entry: AuditEntry): Promise<void>;
  query(filter: { userId?: string; action?: AuditAction; from?: number; to?: number; limit?: number }): Promise<AuditEntry[]>;
}

/** In-memory ring — fine for tests; Firestore adapter swaps in for prod. */
export class MemoryAuditStorage implements AuditStorage {
  private entries: AuditEntry[] = [];
  async append(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
  async query(filter: { userId?: string; action?: AuditAction; from?: number; to?: number; limit?: number }): Promise<AuditEntry[]> {
    return this.entries
      .filter((e) =>
        (!filter.userId || e.userId === filter.userId) &&
        (!filter.action || e.action === filter.action) &&
        (!filter.from || e.ts >= filter.from) &&
        (!filter.to || e.ts <= filter.to),
      )
      .slice(-(filter.limit ?? 1000));
  }
}

function ulid(): string {
  // Compact 16-char timestamp + randomness. Not cryptographic — used only
  // for ordering + uniqueness; the HMAC carries the integrity guarantee.
  const t = Date.now().toString(36).padStart(8, '0');
  const r = Math.random().toString(36).slice(2, 10).padStart(8, '0');
  return `${t}${r}`;
}

function canonicalize(entry: Omit<AuditEntry, 'sig'>): string {
  // Stable JSON — sort keys, no whitespace.
  return JSON.stringify(entry, Object.keys(entry).sort());
}

function loadSigningKey(): Buffer {
  const raw = process.env.AUDIT_SIGNING_KEY;
  if (raw) return Buffer.from(raw, 'base64').length >= 16 ? Buffer.from(raw, 'base64') : Buffer.from(raw);
  if (process.env.NODE_ENV === 'production') {
    throw new Error('AUDIT_SIGNING_KEY required in production.');
  }
  return Buffer.from('zigsaw-dev-audit-signing-key-do-not-use-in-prod');
}

export class AuditLog {
  private storage: AuditStorage;
  private signingKey: Buffer;

  constructor(storage: AuditStorage = new MemoryAuditStorage()) {
    this.storage = storage;
    this.signingKey = loadSigningKey();
  }

  async record(input: Omit<AuditEntry, 'id' | 'ts' | 'sig'>): Promise<AuditEntry> {
    const partial: Omit<AuditEntry, 'sig'> = {
      ...input,
      id: ulid(),
      ts: Date.now(),
    };
    const sig = createHmac('sha256', this.signingKey).update(canonicalize(partial)).digest('hex');
    const entry: AuditEntry = { ...partial, sig };
    await this.storage.append(entry);
    return entry;
  }

  /** Re-compute the HMAC and compare. Returns true if record is intact. */
  verify(entry: AuditEntry): boolean {
    const { sig, ...rest } = entry;
    const expected = createHmac('sha256', this.signingKey).update(canonicalize(rest)).digest('hex');
    return expected === sig;
  }

  async query(filter: Parameters<AuditStorage['query']>[0]): Promise<AuditEntry[]> {
    return this.storage.query(filter);
  }
}

/** Convenience: pull IP + UA out of a request-like object. */
export function clientFingerprint(headers: Record<string, string | string[] | undefined>, fallbackIp?: string): { ip: string | null; ua: string | null } {
  const xff = headers['x-forwarded-for'];
  const xffStr = Array.isArray(xff) ? xff[0] : xff;
  const ip = (xffStr ? xffStr.split(',')[0]?.trim() : null) ?? fallbackIp ?? null;
  const ua = (Array.isArray(headers['user-agent']) ? headers['user-agent'][0] : headers['user-agent']) ?? null;
  return { ip, ua };
}
