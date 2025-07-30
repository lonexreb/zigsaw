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
        error: 'Not authenticated',
        message: 'Please sign in with Google first' 
      })
    }

    // Test Gmail API access with different scopes
    const testResults = {
      hasAccessToken: !!token.accessToken,
      hasRefreshToken: !!token.refreshToken,
      userEmail: token.email,
      userName: token.name,
      scopes: {
        readonly: false,
        modify: false,
        send: false,
        compose: false,
        labels: false
      }
    }

    // Test Gmail API calls to verify scopes
    if (token.accessToken) {
      try {
        // Test read access
        const readResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=1', {
          headers: {
            'Authorization': `Bearer ${token.accessToken}`
          }
        })
        testResults.scopes.readonly = readResponse.ok
      } catch (error) {
        console.error('Read scope test failed:', error)
      }

      try {
        // Test labels access
        const labelsResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/labels', {
          headers: {
            'Authorization': `Bearer ${token.accessToken}`
          }
        })
        testResults.scopes.labels = labelsResponse.ok
      } catch (error) {
        console.error('Labels scope test failed:', error)
      }

      try {
        // Test compose access (create a draft)
        const draftResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token.accessToken}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message: {
              raw: Buffer.from('To: test@example.com\r\nSubject: Test\r\n\r\nTest message').toString('base64url')
            }
          })
        })
        testResults.scopes.compose = draftResponse.ok
      } catch (error) {
        console.error('Compose scope test failed:', error)
      }
    }

    return res.json({
      success: true,
      debug: testResults,
      message: 'Gmail scope debug information'
    })

  } catch (error) {
    console.error('Gmail debug error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to debug Gmail scopes'
    })
  }
} 