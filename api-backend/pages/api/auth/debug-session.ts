import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  const origin = req.headers.origin
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000',
    'https://zigsaw.dev',
    'https://zigsaw-frontend.vercel.app',
    'https://zigsaw-backend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean) as string[]
  
  const allowedOrigin = (origin && allowedOrigins.includes(origin)) ? origin : (allowedOrigins[0] || 'http://localhost:8080')
  
  res.setHeader('Access-Control-Allow-Origin', allowedOrigin)
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // Return detailed debug information
    return res.json({
      hasToken: !!token,
      token: token ? {
        email: token.email,
        name: token.name,
        picture: token.picture,
        hasAccessToken: !!token.accessToken,
        hasRefreshToken: !!token.refreshToken,
        iat: token.iat,
        exp: token.exp
      } : null,
      request: {
        method: req.method,
        url: req.url,
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          cookie: req.headers.cookie ? 'Present' : 'Missing',
          'user-agent': req.headers['user-agent']
        },
        cookies: req.cookies
      },
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        frontendUrl: process.env.FRONTEND_URL
      }
    })

  } catch (error) {
    console.error('Debug session error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to debug session',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 