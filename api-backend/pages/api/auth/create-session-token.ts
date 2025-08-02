import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'
import jwt from 'jsonwebtoken'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  const origin = req.headers.origin
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Get the JWT token from the request
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      console.log('Create session token failed: No token found')
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found'
      })
    }

    // Create a session token for cross-domain requests
    const sessionToken = jwt.sign(
      {
        email: token.email,
        name: token.name,
        picture: token.picture,
        accessToken: token.accessToken,
        refreshToken: token.refreshToken,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24) // 24 hours
      },
      process.env.NEXTAUTH_SECRET!
    )

    console.log('Session token created for user:', token.email)

    return res.json({
      success: true,
      sessionToken,
      user: {
        email: token.email,
        name: token.name,
        picture: token.picture,
      },
      hasGmailAccess: !!token.accessToken,
      expiresIn: 86400 // 24 hours in seconds
    })

  } catch (error) {
    console.error('Create session token error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create session token'
    })
  }
}