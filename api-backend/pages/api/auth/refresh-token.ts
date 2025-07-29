import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Secure CORS
  const isLocalhost = req.headers.host?.includes('localhost')
  const allowedOrigin = isLocalhost 
    ? 'http://localhost:8080'
    : process.env.FRONTEND_URL || 'https://your-frontend-domain.com'
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token?.refreshToken) {
      return res.status(401).json({ error: 'No refresh token available' })
    }

    // Refresh the access token using Google's token endpoint
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: token.refreshToken as string,
        grant_type: 'refresh_token',
      })
    })

    if (!response.ok) {
      throw new Error('Failed to refresh token')
    }

    const refreshedTokens = await response.json()

    return res.json({
      access_token: refreshedTokens.access_token,
      expires_in: refreshedTokens.expires_in,
      refreshed_at: new Date().toISOString()
    })

  } catch (error) {
    console.error('Token refresh error:', error)
    return res.status(500).json({ error: 'Failed to refresh token' })
  }
} 