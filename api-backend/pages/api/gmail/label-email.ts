import { NextApiRequest, NextApiResponse } from 'next'
import { getToken } from 'next-auth/jwt'

interface LabelEmailRequest {
  messageId: string
  action: 'add' | 'remove'
  labelIds: string[]
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

    const { messageId, action, labelIds }: LabelEmailRequest = req.body

    if (!messageId || !action || !labelIds || !Array.isArray(labelIds)) {
      return res.status(400).json({ 
        error: 'Invalid request',
        message: 'messageId, action (add/remove), and labelIds array are required' 
      })
    }

    // Call Gmail API to modify labels
    const gmailApiUrl = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}/modify`
    
    const requestBody = action === 'add' 
      ? { addLabelIds: labelIds }
      : { removeLabelIds: labelIds }

    const gmailResponse = await fetch(gmailApiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    })

    if (!gmailResponse.ok) {
      const errorText = await gmailResponse.text()
      console.error('Gmail API error:', errorText)
      return res.status(gmailResponse.status).json({
        error: 'Gmail API error',
        message: `Failed to ${action} labels`,
        details: errorText
      })
    }

    const result = await gmailResponse.json()

    return res.json({
      success: true,
      action,
      messageId,
      labelIds,
      result,
      message: `Successfully ${action === 'add' ? 'added' : 'removed'} labels`
    })

  } catch (error) {
    console.error('Label email error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to modify email labels',
      details: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
