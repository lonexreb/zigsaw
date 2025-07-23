import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'
import { setCookie } from 'nookies'

const clientId = process.env.SLACK_CLIENT_ID
const clientSecret = process.env.SLACK_CLIENT_SECRET
const redirectUri = process.env.SLACK_REDIRECT_URI

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { code } = req.query
  if (!code || typeof code !== 'string') {
    res.status(400).send('Missing code')
    return
  }
  if (!clientId || !clientSecret || !redirectUri) {
    res.status(500).send('Slack OAuth not configured')
    return
  }
  try {
    // Exchange code for access token
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      },
    })
    const { access_token, authed_user, ok, error } = response.data
    if (!ok || !access_token) {
      res.status(400).send('Slack OAuth failed: ' + (error || 'Unknown error'))
      return
    }
    // Store token in secure HTTP-only cookie
    setCookie({ res }, 'slack_access_token', access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      sameSite: 'lax',
    })
    // Redirect back to workflow editor
    res.redirect('/workflow')
  } catch (err) {
    res.status(500).send('Slack OAuth error')
  }
} 