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
    const { apiKey, url = 'https://example.com' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    console.log('Testing Firecrawl API with key:', apiKey.substring(0, 10) + '...');
    console.log('Testing URL:', url);

    // Try different API endpoints
    const endpoints = [
      'https://api.firecrawl.dev/scrape',
      'https://api.firecrawl.dev/v1/scrape',
      'https://api.firecrawl.dev/api/scrape'
    ];

    for (const endpoint of endpoints) {
      try {
        console.log('Trying endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            url: url
          })
        });

        console.log('Response status:', response.status);
        console.log('Response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          const data = await response.json();
          console.log('Success with endpoint:', endpoint);
          return res.status(200).json({ 
            success: true, 
            endpoint: endpoint,
            data: data 
          });
        } else {
          const errorText = await response.text();
          console.log('Error with endpoint:', endpoint, response.status, errorText);
          
          if (endpoint === endpoints[endpoints.length - 1]) {
            // Last endpoint failed
            return res.status(response.status).json({ 
              error: `All endpoints failed. Last error: ${response.status} ${response.statusText}`,
              details: errorText,
              triedEndpoints: endpoints
            });
          }
        }
      } catch (error) {
        console.log('Exception with endpoint:', endpoint, error);
        
        if (endpoint === endpoints[endpoints.length - 1]) {
          // Last endpoint failed
          return res.status(500).json({ 
            error: 'All endpoints failed with exceptions',
            details: error instanceof Error ? error.message : 'Unknown error',
            triedEndpoints: endpoints
          });
        }
      }
    }

  } catch (error) {
    console.error('Test Firecrawl API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 