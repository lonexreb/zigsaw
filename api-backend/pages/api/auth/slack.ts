import type { NextApiRequest, NextApiResponse } from 'next'

const clientId = process.env.SLACK_CLIENT_ID
const redirectUri = process.env.SLACK_REDIRECT_URI
const scopes = [
  'channels:read',
  'chat:write',
  'users:read',
  // add more scopes as needed
].join(',')

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!clientId || !redirectUri) {
    res.status(500).json({ error: 'Slack OAuth not configured' })
    return
  }
  const url = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&scope=${encodeURIComponent(scopes)}&redirect_uri=${encodeURIComponent(redirectUri)}`
  res.redirect(url)
}

// Implement the callback handler at /api/auth/slack/callback next 