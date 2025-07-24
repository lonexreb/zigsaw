import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { serialize } from 'cookie'
import { createSession } from '../../../src/sessionService'

const GOOGLE_TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_ENDPOINT = 'https://www.googleapis.com/oauth2/v2/userinfo'

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
    const tokenRes = await axios.post(GOOGLE_TOKEN_ENDPOINT, {
      code,
      client_id: process.env.GMAIL_CLIENT_ID,
      client_secret: process.env.GMAIL_CLIENT_SECRET,
      redirect_uri: process.env.GMAIL_REDIRECT_URI,
      grant_type: 'authorization_code',
    }, {
      headers: { 'Content-Type': 'application/json' },
    })
    const { access_token, refresh_token, id_token } = tokenRes.data
    if (!access_token) {
      res.status(500).json({ error: 'No access token returned from Google' })
      return
    }
    // Optionally fetch user info
    let userInfo = null
    try {
      const userRes = await axios.get(GOOGLE_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      userInfo = userRes.data
    } catch (userErr) {
      // Log but do not block login
      console.error('Failed to fetch Google user info', userErr)
    }
    // Create session and set HttpOnly cookie
    const sessionId = createSession({
      provider: 'gmail',
      access_token,
      refresh_token,
      id_token,
      userInfo,
    })
    res.setHeader('Set-Cookie', serialize('session', sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 1 week
    }))
    res.redirect('/dashboard')
  } catch (err) {
    console.error('Google OAuth callback error', err)
    res.status(500).json({ error: 'Token exchange failed' })
  }
} 