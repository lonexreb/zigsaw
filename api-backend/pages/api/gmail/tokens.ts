import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

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