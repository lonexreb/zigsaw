import type { NextApiRequest, NextApiResponse } from 'next'

interface GenerateVideoRequest {
  prompt: string
  image_url?: string
  style?: string
  duration?: number
  quality?: string
}

interface GenerateVideoResponse {
  success: boolean
  data?: any
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<GenerateVideoResponse>
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
    const { prompt, image_url, style, duration, quality } = req.body as GenerateVideoRequest

    if (!prompt) {
              // Set CORS headers for validation error
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(400).json({ success: false, error: 'Prompt is required' })
    }

    console.log('🎬 Video generation request:', { prompt, image_url, style, duration, quality })

    // Call the FastAPI backend
    const fastApiUrl = 'https://degree-works-backend-hydrabeans.replit.app/generate-video'
    
    const requestBody = {
      prompt,
      image_url: image_url || 'https://example.com/placeholder.jpg', // Default placeholder if not provided
      style: style || 'cinematic',
      duration: duration || 10,
      quality: quality || 'high'
    }

    console.log('📡 Calling FastAPI backend:', fastApiUrl)
    console.log('📤 Request body:', JSON.stringify(requestBody, null, 2))
    
    // Create AbortController for timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for video generation
    
    try {
      const response = await fetch(fastApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      
      console.log('📥 FastAPI response status:', response.status)
      console.log('📥 FastAPI response headers:', Object.fromEntries(response.headers.entries()))

      if (!response.ok) {
        let errorText = ''
        try {
          errorText = await response.text()
          console.error('❌ FastAPI video generation error response:', errorText)
        } catch (textError) {
          console.error('❌ Could not read error response text:', textError)
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        
        // Set CORS headers for FastAPI error response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(response.status).json({ 
          success: false, 
          error: `FastAPI error: ${response.status} - ${errorText}` 
        })
      }

      let data
      try {
        data = await response.json()
        console.log('✅ FastAPI response data:', JSON.stringify(data, null, 2))
      } catch (jsonError) {
        console.error('❌ Could not parse FastAPI response as JSON:', jsonError)
        const responseText = await response.text()
        console.log('📄 Raw response text:', responseText)
        // Set CORS headers for JSON parsing error response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(500).json({
          success: false,
          error: 'Invalid JSON response from FastAPI backend'
        })
      }
      
      // Set CORS headers for successful response
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      
      return res.status(200).json({
        success: true,
        data
      })

    } catch (fetchError) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        console.error('❌ Request timeout after 2 minutes')
        // Set CORS headers for timeout error response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(504).json({
          success: false,
          error: 'Request timeout - FastAPI backend took too long to respond (video generation can take 1-2 minutes)'
        })
      }
      
      console.error('❌ Fetch error:', fetchError)
              // Set CORS headers for network error response
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        
        return res.status(500).json({
          success: false,
          error: `Network error: ${fetchError.message}`
        })
    }

  } catch (error) {
    console.error('❌ Video generation API error:', error)
    
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
