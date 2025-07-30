import { NextApiRequest, NextApiResponse } from 'next'

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const isLocalhost = req.headers.host?.includes('localhost')
  const backendUrl = isLocalhost 
    ? 'http://localhost:3000' 
    : 'https://zigsaw-backend.vercel.app'
  
  const callbackUrl = encodeURIComponent(process.env.FRONTEND_URL || 'http://localhost:8080')
  const authUrl = `${backendUrl}/api/auth/signin/google?callbackUrl=${callbackUrl}`

  res.status(200).json({
    message: 'Auth redirect test',
    authUrl,
    frontendUrl: process.env.FRONTEND_URL,
    isLocalhost,
    backendUrl
  })
} 