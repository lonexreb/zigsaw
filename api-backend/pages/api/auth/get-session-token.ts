import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'

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

    if (!token) {
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found'
      })
    }

    // Create a short-lived session token for cross-domain requests
    const sessionToken = jwt.sign(
      {
        email: token.email,
        name: token.name,
        picture: token.picture,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
      },
      process.env.NEXTAUTH_SECRET!
    )

    return res.json({
      authenticated: true,
      sessionToken,
      user: {
        email: token.email,
        name: token.name,
        picture: token.picture,
      },
      hasGmailAccess: !!token.accessToken,
      expiresIn: 3600 // 1 hour in seconds
    })

  } catch (error) {
    console.error('Get session token error:', error)
    return res.status(500).json({ 
      authenticated: false,
      error: 'Internal server error',
      message: 'Failed to get session token'
    })
  }
} 