import type { NextApiRequest, NextApiResponse } from 'next'
import axios from 'axios'

const GCL_TOKEN_ENDPOINT = process.env.GCL_TOKEN_ENDPOINT || 'https://gcl.example.com/oauth/token'
const GCL_USERINFO_ENDPOINT = process.env.GCL_USERINFO_ENDPOINT || 'https://gcl.example.com/api/userinfo'

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
    const tokenRes = await axios.post(GCL_TOKEN_ENDPOINT, {
      code,
      client_id: process.env.GCL_CLIENT_ID,
      client_secret: process.env.GCL_CLIENT_SECRET,
      redirect_uri: process.env.GCL_REDIRECT_URI,
      grant_type: 'authorization_code',
    }, {
      headers: { 'Content-Type': 'application/json' },
    })
    const { access_token, refresh_token, id_token } = tokenRes.data
    if (!access_token) {
      res.status(500).json({ error: 'No access token returned from GCL' })
      return
    }
    // Optionally fetch user info
    let userInfo = null
    try {
      const userRes = await axios.get(GCL_USERINFO_ENDPOINT, {
        headers: { Authorization: `Bearer ${access_token}` },
      })
      userInfo = userRes.data
    } catch (userErr) {
      // Log but do not block login
      console.error('Failed to fetch GCL user info', userErr)
    }
    // TODO: Store tokens securely (e.g., set HttpOnly cookie, session, or DB)
    // res.setHeader('Set-Cookie', ...)
    // Optionally store userInfo
    res.redirect('/dashboard')
  } catch (err) {
    console.error('GCL OAuth callback error', err)
    res.status(500).json({ error: 'Token exchange failed' })
  }
} 