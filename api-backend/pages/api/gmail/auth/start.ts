import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

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

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/gmail/auth/callback`
    const state = Math.random().toString(36).substring(2)
    
    // Store state for verification
    // In production, you'd want to store this in a database or session
    
    // Gmail API OAuth URL with explicit scopes
    const gmailAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    gmailAuthUrl.searchParams.set('client_id', clientId!)
    gmailAuthUrl.searchParams.set('redirect_uri', redirectUri)
    gmailAuthUrl.searchParams.set('response_type', 'code')
    gmailAuthUrl.searchParams.set('scope', [
      'openid',
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/gmail.labels'
    ].join(' '))
    gmailAuthUrl.searchParams.set('access_type', 'offline')
    gmailAuthUrl.searchParams.set('prompt', 'consent')
    gmailAuthUrl.searchParams.set('state', state)

    // Redirect to Google OAuth with Gmail scopes
    res.redirect(gmailAuthUrl.toString())

  } catch (error) {
    console.error('Gmail auth start error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to start Gmail authentication'
    })
  }
} 