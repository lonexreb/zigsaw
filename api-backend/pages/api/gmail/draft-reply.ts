import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

interface DraftReplyRequest {
  threadId: string
  to: string
  subject: string
  body: string
  inReplyTo?: string
  references?: string
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
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
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

    const { threadId, to, subject, body, inReplyTo, references }: DraftReplyRequest = req.body

    if (!threadId || !to || !subject || !body) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'threadId, to, subject, and body are required' 
      })
    }

    // Create email message in RFC 2822 format
    const emailLines = [
      `To: ${to}`,
      `Subject: ${subject}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
    ]

    // Add reply headers if provided
    if (inReplyTo) {
      emailLines.push(`In-Reply-To: ${inReplyTo}`)
    }
    if (references) {
      emailLines.push(`References: ${references}`)
    }

    emailLines.push('') // Empty line to separate headers from body
    emailLines.push(body)

    const rawMessage = emailLines.join('\r\n')
    const encodedMessage = Buffer.from(rawMessage).toString('base64url')

    // Create draft via Gmail API
    const gmailApiUrl = 'https://gmail.googleapis.com/gmail/v1/users/me/drafts'
    
    const draftBody = {
      message: {
        threadId: threadId,
        raw: encodedMessage
      }
    }

    const gmailResponse = await fetch(gmailApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(draftBody)
    })

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text()
      console.error('Gmail API error:', errorText)
      return res.status(gmailResponse.status).json({
        error: 'Gmail API error',
        message: 'Failed to create draft reply',
        details: errorText
      })
    }

    const result = await gmailResponse.json()

    return res.json({
      success: true,
      threadId,
      draftId: result.id,
      messageId: result.message?.id,
      result,
      message: 'Draft reply created successfully',
      preview: {
        to,
        subject,
        bodyPreview: body.substring(0, 100) + (body.length > 100 ? '...' : '')
      }
    })

  } catch (error) {
    console.error('Draft reply error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to create draft reply',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
