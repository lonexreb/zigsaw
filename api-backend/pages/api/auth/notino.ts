import type { NextApiRequest, NextApiResponse } from 'next'

const clientId = process.env.NOTINO_CLIENT_ID
const redirectUri = process.env.NOTINO_REDIRECT_URI
const scopes = [
  // 'scope1',
  // 'scope2',
  // add more scopes as needed
].join(' ')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Notino OAuth not configured' })
    return
  }
  // Replace the following URL with the actual Notino OAuth endpoint and parameters
  const url = `https://notino.example.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}`
  res.redirect(url)
}

// Implement the callback handler at /api/auth/notino/callback next 