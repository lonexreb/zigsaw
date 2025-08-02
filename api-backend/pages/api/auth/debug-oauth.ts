import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS headers
  const origin = req.headers.origin
  res.setHeader('Access-Control-Allow-Origin', origin || 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Access-Control-Allow-Credentials', 'true')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    return res.json({
      message: 'OAuth debug endpoint',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasGoogleClientId: !!process.env.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        frontendUrl: process.env.FRONTEND_URL
      },
      request: {
        method: req.method,
        url: req.url,
        query: req.query,
        headers: {
          origin: req.headers.origin,
          host: req.headers.host,
          userAgent: req.headers['user-agent']
        }
      },
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Debug OAuth error:', error)
    return res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to debug OAuth'
    })
  }
}