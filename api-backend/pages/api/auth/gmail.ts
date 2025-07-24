import type { NextApiRequest, NextApiResponse } from 'next'

const clientId = process.env.GMAIL_CLIENT_ID
const redirectUri = process.env.GMAIL_REDIRECT_URI
const scopes = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  // add more scopes as needed
].join(' ')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Gmail OAuth not configured' })
    return
  }
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scopes)}&access_type=offline&prompt=consent`
  res.redirect(url)
}

// Implement the callback handler at /api/auth/gmail/callback next 