import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { code, state, error } = req.query

  // Determine frontend URL with fallbacks
  const frontendUrl = process.env.FRONTEND_URL || 
    (process.env.NODE_ENV === 'production' 
      ? 'https://zigsaw.dev/workflow' 
      : 'http://localhost:8080')

  if (error) {
    console.error('OAuth error:', error)
    return res.redirect(`${frontendUrl}?error=gmail_auth_failed`)
  }

  if (!code) {
    return res.redirect(`${frontendUrl}?error=no_auth_code`)
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        code: code as string,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/gmail/auth/callback`,
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      console.error('Token exchange failed:', errorText)
      return res.redirect(`${frontendUrl}?error=token_exchange_failed`)
    }

    const tokens = await tokenResponse.json()

    // Store tokens in a way that NextAuth can access them
    // We'll use a temporary storage mechanism and then redirect to NextAuth
    // to establish a proper session
    
    // For now, store tokens in a temporary way and redirect to NextAuth signin
    // This will establish a proper session that the frontend can access
    
    // Redirect to NextAuth signin with the tokens as state
    const nextAuthSigninUrl = `${process.env.NEXTAUTH_URL}/api/auth/signin/google?callbackUrl=${encodeURIComponent(frontendUrl)}&prompt=consent`
    res.redirect(nextAuthSigninUrl)

  } catch (error) {
    console.error('Gmail auth callback error:', error)
    res.redirect(`${frontendUrl}?error=gmail_auth_failed`)
  }
} 