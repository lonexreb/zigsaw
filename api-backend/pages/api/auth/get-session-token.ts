import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers - Allow all origins for now to debug
  const origin = req.headers.origin
  
  // Set CORS headers to allow the frontend domain
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400') // 24 hours

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
      console.log('Get session token failed: No token found')
      console.log('Request cookies:', req.headers.cookie)
      console.log('Request origin:', origin)
      
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found',
        debug: {
          hasCookies: !!req.headers.cookie,
          origin: origin,
          cookies: req.headers.cookie ? 'Present' : 'Missing'
        }
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