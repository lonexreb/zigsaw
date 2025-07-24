import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const NOTION_TOKEN_ENDPOINT = 'https://api.notion.com/v1/oauth/token'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const code = req.query.code as string
  const error = req.query.error as string

  if (error) {
    res.status(400).json({ error })
    return
  }
  if (!code) {
    res.status(400).json({ error: 'No authorization code provided' })
    return
  }

  try {
    const tokenRes = await axios.post(NOTION_TOKEN_ENDPOINT, {
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.NOTION_REDIRECT_URI,
    }, {
      auth: {
        username: process.env.NOTION_CLIENT_ID || '',
        password: process.env.NOTION_CLIENT_SECRET || '',
      },
      headers: { 'Content-Type': 'application/json' },
    })
    const { access_token, workspace_id, bot_id } = tokenRes.data
    if (!access_token) {
      res.status(500).json({ error: 'No access token returned from Notion' })
      return
    }
    // Notion does not have a standard userinfo endpoint
    // TODO: Store tokens securely (e.g., set HttpOnly cookie, session, or DB)
    // res.setHeader('Set-Cookie', ...)
    res.redirect('/dashboard')
  } catch (err) {
    console.error('Notion OAuth callback error', err)
    res.status(500).json({ error: 'Token exchange failed' })
  }
} 