import type { NextApiRequest, NextApiResponse } from 'next'

// Dummy auth check (replace with real auth logic as needed)
function getUserFromRequest(req: NextApiRequest) {
  // Example: check for Authorization header
  const auth = req.headers.authorization
  if (!auth || !auth.startsWith('Bearer ')) return null
  // In production, verify the token here
  return { id: 'dummy-user' }
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const user = getUserFromRequest(req)
  if (!user) {
    res.status(401).json({ detail: 'Unauthorized' })
    return
  }
  // Return a default free plan
  res.status(200).json({
    plan: 'free',
    api_requests_count: 0,
    api_limit: 100
  })
} 