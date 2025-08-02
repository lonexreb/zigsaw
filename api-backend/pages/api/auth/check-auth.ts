import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

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
      return res.status(200).json({ 
        authenticated: false,
        message: 'No session found',
        signInUrl: 'https://zigsaw-backend.vercel.app/api/auth/signin/google'
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
    console.error('Check auth error:', error)
    return res.status(500).json({ 
      authenticated: false,
      error: 'Internal server error',
      message: 'Failed to check authentication'
    })
  }
} 