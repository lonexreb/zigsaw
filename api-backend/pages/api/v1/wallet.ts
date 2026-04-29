import type { NextApiRequest, NextApiResponse } from 'next';
import { WalletService } from '../../../lib/billing/wallet';
import { rateLimit, applyHeaders } from '../../../lib/rate-limit';

// Singleton — wired to a real storage adapter (Firestore) when persisting.
const wallets = new WalletService();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const verdict = await rateLimit(req, { kind: 'default' });
  applyHeaders(res, verdict);
  if (!verdict.ok) {
    return res.status(429).json({ error: 'Rate limit exceeded', retryAfter: verdict.retryAfterSec });
  }

  // TEMP user identification — proper Firebase JWT verification lands with
  // the auth middleware (tracked separately). For now require an explicit
  // userId in the body or query so we never silently fail open.
  const userId = (req.method === 'GET' ? (req.query.userId as string | undefined) : req.body?.userId) ?? null;
  if (!userId) {
    return res.status(400).json({ error: 'userId required' });
  }

  try {
    if (req.method === 'GET') {
      const wallet = await wallets.getOrCreate(userId);
      return res.status(200).json({ success: true, data: wallet });
    }

    if (req.method === 'POST') {
      const { action } = req.body ?? {};
      if (action === 'start_trial') {
        const wallet = await wallets.startTrial(userId);
        return res.status(200).json({ success: true, data: wallet });
      }
      if (action === 'set_plan') {
        const { tier, stripeCustomerId } = req.body;
        const wallet = await wallets.setPlan(userId, tier, stripeCustomerId);
        return res.status(200).json({ success: true, data: wallet });
      }
      return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(400).json({
      error: error instanceof Error ? error.message : 'Wallet operation failed',
    });
  }
}
