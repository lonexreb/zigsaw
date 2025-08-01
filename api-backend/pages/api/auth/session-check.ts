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
    let token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    // If no token from cookies, try to get it from Authorization header
    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization
      if (authHeader.startsWith('Bearer ')) {
        const tokenString = authHeader.substring(7)
        try {
          // Try to decode the JWT token manually
          const secret = process.env.NEXTAUTH_SECRET
          if (!secret) {
            throw new Error('NEXTAUTH_SECRET not configured')
          }
          const decoded = jwt.verify(tokenString, secret) as any
          token = decoded
        } catch (jwtError) {
          console.log('JWT verification failed:', jwtError instanceof Error ? jwtError.message : 'Unknown error')
        }
      }
    }

    if (!token) {
      console.log('Session check failed: No token found')
      console.log('Request cookies:', req.headers.cookie)
      console.log('Request authorization:', req.headers.authorization)
      console.log('Request origin:', origin)
      
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found',
        debug: {
          hasCookies: !!req.headers.cookie,
          hasAuthorization: !!req.headers.authorization,
          origin: origin,
          cookies: req.headers.cookie ? 'Present' : 'Missing'
        }
      })
    }

    // Return session info
    return res.json({
      authenticated: true,
      user: {
        email: token.email,
        name: token.name,
        picture: token.picture,
      },
      hasGmailAccess: !!token.accessToken,
      scopes: token.accessToken ? [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify', 
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.labels',
        'https://www.googleapis.com/auth/calendar.readonly',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events'
      ] : []
    })

  } catch (error) {
    console.error('Session check error:', error)
    return res.status(500).json({ 
      authenticated: false,
      error: 'Internal server error',
      message: 'Failed to check session'
    })
  }
} 