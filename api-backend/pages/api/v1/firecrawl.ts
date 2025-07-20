import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { url, extract_text = true, extract_links = false, extract_images = false, apiKey } = req.body;

    console.log('=== FIREcrawl Backend Debug ===');
    console.log('Request body:', req.body);
    console.log('Extracted parameters:', { url, extract_text, extract_links, extract_images, apiKey: apiKey ? `${apiKey.substring(0, 10)}...` : 'NOT SET' });

    if (!url || !apiKey) {
      console.log('Missing parameters - URL:', !!url, 'API Key:', !!apiKey);
      return res.status(400).json({ error: 'Missing required parameters: url and apiKey' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Call Firecrawl API
    console.log('Making Firecrawl API request to:', 'https://api.firecrawl.dev/v1/scrape');
    console.log('Request payload:', { url: url });
    
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url
      })
    });
    
    console.log('Firecrawl API response status:', response.status);
    console.log('Firecrawl API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Firecrawl API request failed: ${response.status} ${response.statusText}`, errorText);
      
      let errorDetails = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorDetails = errorJson.error.message;
        }
      } catch (e) {
        // If parsing fails, use the raw error text
      }
      
      return res.status(response.status).json({ 
        error: `Firecrawl API request failed: ${response.status} ${response.statusText}`,
        details: errorDetails
      });
    }

    const data = await response.json();
    console.log('Firecrawl API response data:', data);
    
    // Extract relevant data based on user preferences
    const result = {
      url: url,
      title: data.title || '',
      description: data.description || '',
      content: extract_text ? data.text || data.markdown || data.html || '' : '',
      links: extract_links ? data.links || [] : [],
      images: extract_images ? data.images || [] : [],
      metadata: data.metadata || {},
      timestamp: new Date().toISOString()
    };

    console.log('Final result being sent to client:', result);
    res.status(200).json(result);

  } catch (error) {
    console.error('Firecrawl API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 