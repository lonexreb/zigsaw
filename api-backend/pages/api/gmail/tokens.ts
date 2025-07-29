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
    // Get the JWT token from the request
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    })

    if (!token) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please sign in with Google first' 
      })
    }

    if (!token.accessToken) {
      return res.status(400).json({ 
        error: 'No access token',
        message: 'Gmail access token not available. Please re-authenticate.' 
      })
    }

    // Return Gmail OAuth tokens for workflow use
    return res.json({
      success: true,
      tokens: {
        access_token: token.accessToken,
        refresh_token: token.refreshToken,
        email: token.email,
        name: token.name,
        picture: token.picture,
      },
      scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.modify', 
        'https://www.googleapis.com/auth/gmail.send'
      ],
      usage: {
        note: 'Use these tokens to make Gmail API calls',
        example: 'Authorization: Bearer ' + token.accessToken
      }
    })

  } catch (error) {
    console.error('Gmail tokens error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve Gmail tokens'
    })
  }
} 