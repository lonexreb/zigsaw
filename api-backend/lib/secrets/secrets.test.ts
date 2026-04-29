/**
 * Round-trip + tamper tests for the secrets vault. Run with the api-backend
 * Jest config when one lands. Until then, this file documents the contract
 * and is type-checked by CI.
 */

import { describe, it, expect, beforeAll } from '@jest/globals';
import { SecretsVault, MemoryVaultStorage, userProviderKey } from './index';

describe('SecretsVault', () => {
  beforeAll(() => {
    process.env.SECRETS_MASTER_KEY = Buffer.alloc(32, 7).toString('base64');
  });

  it('encrypts then decrypts a secret unchanged', async () => {
    const vault = new SecretsVault(new MemoryVaultStorage());
    const k = userProviderKey('u_test', 'anthropic');
    await vault.put(k, 'sk-secret-value');
    const got = await vault.get(k);
    expect(got).toBe('sk-secret-value');
  });

  it('returns null for unknown keys', async () => {
    const vault = new SecretsVault(new MemoryVaultStorage());
    expect(await vault.get('nope')).toBeNull();
  });

  it('refuses to store an empty string', async () => {
    const vault = new SecretsVault(new MemoryVaultStorage());
    await expect(vault.put('k', '')).rejects.toThrow();
  });

  it('rejects tampered ciphertext (GCM auth tag)', async () => {
    const storage = new MemoryVaultStorage();
    const vault = new SecretsVault(storage);
    await vault.put('k', 'hello');
    // tamper with the stored record
    const rec = await storage.get('k');
    expect(rec).not.toBeNull();
    if (rec) {
      const ctBuf = Buffer.from(rec.ct, 'base64');
      ctBuf[0] = ctBuf[0] ^ 0xff;
      rec.ct = ctBuf.toString('base64');
      await storage.put('k', rec);
    }
    await expect(vault.get('k')).rejects.toThrow(/tamper|wrong key|auth/i);
  });
});
