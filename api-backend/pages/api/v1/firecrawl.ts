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

    if (!url || !apiKey) {
      return res.status(400).json({ error: 'Missing required parameters: url and apiKey' });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    // Call Firecrawl API
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: url,
        extract: {
          text: true,
          links: extract_links,
          images: extract_images,
          metadata: true
        }
      })
    });

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
    
    // Extract relevant data based on user preferences
    const result = {
      url: url,
      title: data.metadata?.title || '',
      description: data.metadata?.description || '',
      content: extract_text ? data.text || data.markdown || data.html || '' : '',
      links: extract_links ? data.links || [] : [],
      images: extract_images ? data.images || [] : [],
      metadata: data.metadata || {},
      timestamp: new Date().toISOString()
    };

    res.status(200).json(result);

  } catch (error) {
    console.error('Firecrawl API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 