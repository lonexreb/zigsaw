import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  const origin = req.headers.origin
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Return debug information
    return res.json({
      hasToken: !!token,
      token: token ? {
        email: token.email,
        name: token.name,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken
      } : null,
      request: {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          cookie: req.headers.cookie ? 'Present' : 'Missing'
        }
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        frontendUrl: process.env.FRONTEND_URL
      }
    })

  } catch (error) {
    console.error('Test redirect error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to test redirect',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 