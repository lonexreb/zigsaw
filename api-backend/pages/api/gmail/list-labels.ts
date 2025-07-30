import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS Headers
  const origin = req.headers.origin
  const allowedOrigins = [
    'http://localhost:8080',
    'http://localhost:3000', 
    'https://zigsaw.dev',
    'https://zigsaw-frontend.vercel.app',
    process.env.FRONTEND_URL
  ].filter(Boolean) as string[]
  
  const allowedOrigin = (origin && allowedOrigins.includes(origin)) ? origin : allowedOrigins[0]
  
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
    // Get NextAuth token
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token?.accessToken) {
      return res.status(401).json({ 
        error: 'Not authenticated',
        message: 'Please sign in with Google first' 
      })
    }

    // Call Gmail API to get labels
    const gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/labels'

    const gmailResponse = await fetch(gmailApiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      }
    })

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text()
      console.error('Gmail API error:', errorText)
      return res.status(gmailResponse.status).json({
        error: 'Gmail API error',
        message: 'Failed to list labels',
        details: errorText
      })
    }

    const result = await gmailResponse.json()

    // Organize labels by type
    const systemLabels = []
    const userLabels = []
    
    if (result.labels) {
      for (const label of result.labels) {
        if (label.type === 'system') {
          systemLabels.push(label)
        } else {
          userLabels.push(label)
        }
      }
    }

    return res.json({
      success: true,
      labels: result.labels || [],
      organized: {
        system: systemLabels,
        user: userLabels
      },
      common: {
        inbox: systemLabels.find(l => l.name === 'INBOX')?.id,
        sent: systemLabels.find(l => l.name === 'SENT')?.id,
        draft: systemLabels.find(l => l.name === 'DRAFT')?.id,
        spam: systemLabels.find(l => l.name === 'SPAM')?.id,
        trash: systemLabels.find(l => l.name === 'TRASH')?.id,
        important: systemLabels.find(l => l.name === 'IMPORTANT')?.id,
        starred: systemLabels.find(l => l.name === 'STARRED')?.id,
        unread: systemLabels.find(l => l.name === 'UNREAD')?.id
      },
      usage: {
        note: 'Use label IDs for labeling emails',
        example: 'Use "STARRED" or "IMPORTANT" in labelIds array'
      }
    })

  } catch (error) {
    console.error('List labels error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to list labels',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
