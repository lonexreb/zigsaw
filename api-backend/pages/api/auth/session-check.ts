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

    if (!token) {
      console.log('Session check failed: No token found')
      console.log('Request cookies:', req.headers.cookie)
      console.log('Request origin:', origin)
      
      return res.status(401).json({ 
        authenticated: false,
        message: 'No session found',
        debug: {
          hasCookies: !!req.headers.cookie,
          origin: origin,
          allowedOrigins: allowedOrigins
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