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

    // Basic format validation for Firecrawl API key
    if (!apiKey.startsWith('fc-') || apiKey.length < 10) {
      return res.status(200).json({ 
        valid: false, 
        error: 'Invalid API key format. Firecrawl API keys should start with "fc-"' 
      });
    }

    // Test the API key with a real request to a simple test URL
    const testUrl = 'https://httpbin.org/html';
    const endpoints = [
      'https://api.firecrawl.dev/scrape',
      'https://api.firecrawl.dev/v1/scrape',
      'https://api.firecrawl.dev/api/scrape'
    ];

    let lastError = null;

    for (const endpoint of endpoints) {
      try {
        console.log('Testing Firecrawl API with endpoint:', endpoint);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            url: testUrl,
            format: 'markdown',
            only_main_content: true
          })
        });

        if (response.ok) {
          console.log('Firecrawl API key validation successful with endpoint:', endpoint);
          return res.status(200).json({ 
            valid: true, 
            message: 'API key is valid and working',
            endpoint: endpoint
          });
        } else {
          const errorText = await response.text();
          console.log('Firecrawl API validation failed:', response.status, response.statusText, errorText);
          
          let errorDetails = errorText;
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error?.message) {
              errorDetails = errorJson.error.message;
            } else if (errorJson.message) {
              errorDetails = errorJson.message;
            }
          } catch (e) {
            // If parsing fails, use the raw error text
          }
          
          lastError = {
            status: response.status,
            statusText: response.statusText,
            details: errorDetails,
            endpoint: endpoint
          };
          
          // If this is the last endpoint, return the error
          if (endpoint === endpoints[endpoints.length - 1]) {
            return res.status(200).json({ 
              valid: false, 
              error: `API key validation failed: ${response.status} ${response.statusText}`,
              details: errorDetails,
              endpoint: endpoint
            });
          }
        }
      } catch (error) {
        console.error('Exception during Firecrawl API validation:', error);
        lastError = {
          status: 500,
          statusText: 'Internal Error',
          details: error instanceof Error ? error.message : 'Unknown error',
          endpoint: endpoint
        };
        
        // If this is the last endpoint, return the error
        if (endpoint === endpoints[endpoints.length - 1]) {
          return res.status(200).json({ 
            valid: false, 
            error: 'API key validation failed due to network error',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // Fallback - should not reach here
    return res.status(200).json({ 
      valid: false, 
      error: 'API key validation failed',
      details: lastError?.details || 'Unknown error'
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