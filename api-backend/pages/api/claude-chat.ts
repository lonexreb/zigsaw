import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    res.status(401).json({ error: 'Missing Claude API key in backend env' })
    return
  }

  try {
    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(req.body)
    })
    const data = await anthropicRes.json()
    res.status(anthropicRes.status).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
} 