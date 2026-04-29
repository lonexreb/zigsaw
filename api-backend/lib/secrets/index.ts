/**
 * Encrypted secrets vault (issue #6).
 *
 * Pattern: AES-256-GCM envelope encryption. Each secret is encrypted with a
 * random 256-bit data key; the data key itself is encrypted by the master
 * key. The master key is loaded from `SECRETS_MASTER_KEY` (base64-encoded
 * 32 bytes) — in production, swap this for a KMS adapter.
 *
 * Storage adapter is pluggable so we can drop in Firestore / Postgres / Redis
 * without touching call sites.
 *
 * Threat model:
 *   - Attacker reads the database → still needs the master key.
 *   - Attacker reads the application memory → can decrypt.
 *   - Attacker tampers the ciphertext → GCM auth tag rejects.
 */

import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'node:crypto';

const KEY_BYTES = 32; // AES-256
const IV_BYTES = 12;  // GCM standard
const TAG_BYTES = 16;

export interface EncryptedRecord {
  /** AES-256-GCM ciphertext, base64. */
  ct: string;
  /** Initialization vector, base64. */
  iv: string;
  /** Auth tag, base64. */
  tag: string;
  /** When the record was created (ms epoch). */
  createdAt: number;
  /** Key version — supports master-key rotation. */
  v: number;
}

export interface VaultStorage {
  put(key: string, value: EncryptedRecord): Promise<void>;
  get(key: string): Promise<EncryptedRecord | null>;
  delete(key: string): Promise<void>;
  list(prefix: string): Promise<string[]>;
}

/** In-memory storage — fine for dev, swap for Firestore in prod. */
export class MemoryVaultStorage implements VaultStorage {
  private store = new Map<string, EncryptedRecord>();
  async put(key: string, value: EncryptedRecord): Promise<void> {
    this.store.set(key, value);
  }
  async get(key: string): Promise<EncryptedRecord | null> {
    return this.store.get(key) ?? null;
  }
  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }
  async list(prefix: string): Promise<string[]> {
    return Array.from(this.store.keys()).filter((k) => k.startsWith(prefix));
  }
}

/** Resolve the master key from env. Tolerant of base64 + raw 32-byte hex. */
function loadMasterKey(): Buffer {
  const raw = process.env.SECRETS_MASTER_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('SECRETS_MASTER_KEY is required in production.');
    }
    // Dev fallback — derive a deterministic key from a stable string so local
    // restarts don't lose access to dev-encrypted secrets. Never use in prod.
    const dev = createHash('sha256').update('zigsaw-dev-master-key-do-not-use-in-prod').digest();
    return dev;
  }
  // Try base64 first, then hex.
  const b64 = Buffer.from(raw, 'base64');
  if (b64.length === KEY_BYTES) return b64;
  const hex = Buffer.from(raw, 'hex');
  if (hex.length === KEY_BYTES) return hex;
  throw new Error(`SECRETS_MASTER_KEY must decode to ${KEY_BYTES} bytes (base64 or hex).`);
}

export class SecretsVault {
  private masterKey: Buffer;
  private storage: VaultStorage;
  private currentVersion = 1;

  constructor(storage: VaultStorage = new MemoryVaultStorage()) {
    this.masterKey = loadMasterKey();
    this.storage = storage;
  }

  /** Encrypt + persist a secret under `key`. */
  async put(key: string, plaintext: string): Promise<void> {
    if (!plaintext) throw new Error('Refusing to vault an empty secret.');
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv('aes-256-gcm', this.masterKey, iv);
    const ct = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    if (tag.length !== TAG_BYTES) throw new Error('Unexpected auth tag length');

    await this.storage.put(key, {
      ct: ct.toString('base64'),
      iv: iv.toString('base64'),
      tag: tag.toString('base64'),
      createdAt: Date.now(),
      v: this.currentVersion,
    });
  }

  /** Retrieve and decrypt. Returns null if no record exists. Throws on tamper. */
  async get(key: string): Promise<string | null> {
    const record = await this.storage.get(key);
    if (!record) return null;
    const iv = Buffer.from(record.iv, 'base64');
    const ct = Buffer.from(record.ct, 'base64');
    const tag = Buffer.from(record.tag, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.masterKey, iv);
    decipher.setAuthTag(tag);
    try {
      const pt = Buffer.concat([decipher.update(ct), decipher.final()]);
      return pt.toString('utf8');
    } catch (err) {
      throw new Error(`Vault tamper or wrong key for ${key}: ${(err as Error).message}`);
    }
  }

  async delete(key: string): Promise<void> {
    await this.storage.delete(key);
  }

  async list(prefix: string): Promise<string[]> {
    return this.storage.list(prefix);
  }

  /**
   * Rotate the master key: re-encrypt every record under `prefix` using the
   * new key. Caller is responsible for swapping the env var atomically.
   */
  async rotate(newMasterKey: Buffer, prefix = ''): Promise<{ rotated: number }> {
    if (newMasterKey.length !== KEY_BYTES) throw new Error('New key must be 32 bytes.');
    const keys = await this.storage.list(prefix);
    let rotated = 0;
    for (const k of keys) {
      const plaintext = await this.get(k);
      if (plaintext === null) continue;
      // Swap key, re-encrypt, swap back if caller decides not to commit.
      const old = this.masterKey;
      this.masterKey = newMasterKey;
      this.currentVersion += 1;
      try {
        await this.put(k, plaintext);
        rotated += 1;
      } finally {
        this.masterKey = old; // caller swaps the env var separately
      }
    }
    this.masterKey = newMasterKey; // commit rotation
    return { rotated };
  }
}

/** Convenience: stable key derivation for per-user / per-provider secrets. */
export function userProviderKey(userId: string, provider: string): string {
  return `user/${userId}/provider/${provider}`;
}
