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
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ 
        valid: false, 
        error: 'Missing API key' 
      });
    }

    console.log('Validating Firecrawl API key:', apiKey.substring(0, 10) + '...');

    // Test with a simple request to validate the API key
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        url: 'https://example.com'
      })
    });

    console.log('Firecrawl validation response status:', response.status);

    if (response.status === 401) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Invalid API key - 401 Unauthorized' 
      });
    }

    if (response.status === 403) {
      return res.status(200).json({ 
        valid: false, 
        error: 'API key forbidden - 403 Forbidden' 
      });
    }

    if (response.status === 200) {
      const data = await response.json();
      return res.status(200).json({ 
        valid: true, 
        message: 'API key is valid',
        sampleData: {
          hasText: !!data.text,
          hasLinks: !!data.links,
          hasImages: !!data.images,
          url: data.url
        }
      });
    }

    // If we get here, there might be a different issue
    const errorText = await response.text();
    console.log('Firecrawl validation error response:', errorText);
    
    return res.status(200).json({ 
      valid: false, 
      error: `API validation failed: ${response.status} ${response.statusText}`,
      details: errorText
    });

  } catch (error) {
    console.error('Firecrawl validation error:', error);
    res.status(500).json({ 
      valid: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 