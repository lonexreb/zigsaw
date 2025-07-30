import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

interface ListEmailsQuery {
  maxResults?: number
  pageToken?: string
  q?: string // Gmail search query
  labelIds?: string[]
}

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

    // Parse query parameters
    const { 
      maxResults = 10, 
      pageToken, 
      q, 
      labelIds 
    } = req.query as Record<string, string>

    // Build Gmail API URL
    const gmailApiUrl = new URL('https://gmail.googleapis.com/gmail/v1/users/me/messages')
    
    gmailApiUrl.searchParams.set('maxResults', Math.min(Number(maxResults), 50).toString())
    
    if (pageToken) {
      gmailApiUrl.searchParams.set('pageToken', pageToken)
    }
    
    if (q) {
      gmailApiUrl.searchParams.set('q', q)
    }
    
    if (labelIds) {
      const labels = Array.isArray(labelIds) ? labelIds : [labelIds]
      labels.forEach(label => gmailApiUrl.searchParams.append('labelIds', label))
    }

    // Call Gmail API
    const gmailResponse = await fetch(gmailApiUrl.toString(), {
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
        message: 'Failed to list emails',
        details: errorText
      })
    }

    const result = await gmailResponse.json()

    // Get message details for the first few messages
    const messageDetails = []
    if (result.messages && result.messages.length > 0) {
      const detailPromises = result.messages.slice(0, 5).map(async (msg: any) => {
        try {
          const msgResponse = await fetch(
            `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`,
            {
              headers: {
                'Authorization': `Bearer ${token.accessToken}`
              }
            }
          )
          if (msgResponse.ok) {
            return await msgResponse.json()
          }
          return null
        } catch (error) {
          console.error(`Error fetching message ${msg.id}:`, error)
          return null
        }
      })

      const details = await Promise.all(detailPromises)
      messageDetails.push(...details.filter(Boolean))
    }

    return res.json({
      success: true,
      messages: result.messages || [],
      messageDetails,
      nextPageToken: result.nextPageToken,
      resultSizeEstimate: result.resultSizeEstimate,
      query: {
        maxResults: Number(maxResults),
        q,
        labelIds
      },
      usage: {
        note: 'Use message IDs from this response for labeling or drafting replies',
        examples: {
          labelEmail: `POST /api/gmail/label-email with messageId`,
          draftReply: `POST /api/gmail/draft-reply with threadId from message`
        }
      }
    })

  } catch (error) {
    console.error('List emails error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to list emails',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
