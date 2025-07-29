import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Secure CORS - only allow your frontend  
  const isLocalhost = req.headers.host?.includes('localhost')
  const allowedOrigin = isLocalhost 
    ? 'http://localhost:8080'
    : process.env.FRONTEND_URL || 'https://your-frontend-domain.com'
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Get JWT token (server-side)
    const jwtToken = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    console.log('=== Token Debug ===')
    console.log('JWT Token present:', !!jwtToken)
    if (jwtToken) {
      console.log('JWT Token keys:', Object.keys(jwtToken))
      console.log('Access token present:', !!jwtToken.accessToken)
      console.log('Refresh token present:', !!jwtToken.refreshToken)
      console.log('Token scope:', jwtToken.scope)
    }

    return res.json({
      tokenFound: !!jwtToken,
      tokenKeys: jwtToken ? Object.keys(jwtToken) : [],
      hasAccessToken: !!jwtToken?.accessToken,
      hasRefreshToken: !!jwtToken?.refreshToken,
      scope: jwtToken?.scope,
      email: jwtToken?.email,
      tokenPreview: jwtToken?.accessToken && typeof jwtToken.accessToken === 'string' ? 
        `${jwtToken.accessToken.substring(0, 20)}...` : 
        'No access token',
      refreshTokenPreview: jwtToken?.refreshToken && typeof jwtToken.refreshToken === 'string' ? 
        `${jwtToken.refreshToken.substring(0, 20)}...` : 
        'No refresh token',
      timestamp: new Date().toISOString(),
      sessionStrategy: 'JWT (cookies)',
      note: 'Tokens are stored in JWT cookies - they persist until cookie expires'
    })

  } catch (error) {
    console.error('Token debug error:', error)
    return res.status(500).json({ 
      error: 'Failed to check tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 