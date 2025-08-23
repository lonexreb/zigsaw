import type { NextApiRequest, NextApiResponse } from 'next'

interface ScrapeRequest {
  url: string
  prompt?: string
}

interface ScrapeResponse {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ScrapeResponse>
) {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Access-Control-Max-Age', '86400');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    // Set CORS headers for method not allowed response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(405).json({ success: false, error: 'Method not allowed' })
  }

  try {
    const { url, prompt } = req.body as ScrapeRequest

    if (!url) {
      // Set CORS headers for validation error
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return res.status(400).json({ success: false, error: 'URL is required' })
    }

    // Call the FastAPI backend
    const fastApiUrl = 'https://degree-works-backend-hydrabeans.replit.app/scrape'
    
    const response = await fetch(fastApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        prompt: prompt || 'Extract all relevant information from this webpage'
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('FastAPI error:', errorText)
      // Set CORS headers for FastAPI error response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return res.status(response.status).json({ 
        success: false, 
        error: `FastAPI error: ${response.status} - ${errorText}` 
      })
    }

    const data = await response.json()
    
    // Set CORS headers for successful response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(200).json({
      success: true,
      data
    })

  } catch (error) {
    console.error('Scrape API error:', error)
    
    // Set CORS headers for error response
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    return res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    })
  }
}

