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

    console.log('=== Firecrawl Backend Debug ===');
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

    // Validate API key format
    if (!apiKey.startsWith('fc-')) {
      return res.status(400).json({ error: 'Invalid Firecrawl API key format. Should start with "fc-"' });
    }

    // Try multiple Firecrawl API endpoints (updated with correct endpoints)
    const endpoints = [
      'https://api.firecrawl.dev/scrape',
      'https://api.firecrawl.dev/v1/scrape',
      'https://api.firecrawl.dev/api/scrape',
      'https://api.firecrawl.dev/v1/extract',
      'https://api.firecrawl.dev/extract'
    ];

    let lastError = null;
    let data = null;

    for (const endpoint of endpoints) {
      try {
        console.log('Trying Firecrawl API endpoint:', endpoint);
        
        // Different payload structures for different endpoints
        let requestPayload;
        
        if (endpoint.includes('/extract')) {
          // For extract endpoints
          requestPayload = {
            url: url,
            extraction_prompt: "Extract the main content, title, and description from this webpage",
            output_format: "markdown"
          };
        } else {
          // For scrape endpoints
          requestPayload = {
            url: url,
            // Add optional parameters based on user preferences
            ...(extract_text && { extract_text: true }),
            ...(extract_links && { extract_links: true }),
            ...(extract_images && { extract_images: true }),
            // Add common Firecrawl parameters
            format: 'markdown',
            only_main_content: true
          };
        }

        console.log('Request payload:', requestPayload);
        
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify(requestPayload)
        });
        
        console.log('Firecrawl API response status:', response.status);
        console.log('Firecrawl API response headers:', Object.fromEntries(response.headers.entries()));

        if (response.ok) {
          data = await response.json();
          console.log('Success with endpoint:', endpoint);
          console.log('Firecrawl API response data:', data);
          break;
        } else {
          const errorText = await response.text();
          console.error(`Firecrawl API request failed: ${response.status} ${response.statusText}`, errorText);
          
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
          
          // If this is the last endpoint, throw the error
          if (endpoint === endpoints[endpoints.length - 1]) {
            throw new Error(`All Firecrawl endpoints failed. Last error: ${response.status} ${response.statusText} - ${errorDetails}`);
          }
        }
      } catch (error) {
        console.error('Exception with endpoint:', endpoint, error);
        lastError = {
          status: 500,
          statusText: 'Internal Error',
          details: error instanceof Error ? error.message : 'Unknown error',
          endpoint: endpoint
        };
        
        // If this is the last endpoint, throw the error
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw error;
        }
      }
    }

    if (!data) {
      return res.status(lastError?.status || 500).json({ 
        error: `Firecrawl API request failed`,
        details: lastError?.details || 'Unknown error',
        endpoint: lastError?.endpoint
      });
    }
    
    // Extract relevant data based on user preferences and response format
    const result = {
      url: url,
      title: data.title || data.metadata?.title || data.extracted_data?.title || '',
      description: data.description || data.metadata?.description || data.extracted_data?.description || '',
      content: extract_text ? (data.text || data.markdown || data.html || data.content || data.extracted_data?.content || '') : '',
      links: extract_links ? (data.links || data.extracted_data?.links || []) : [],
      images: extract_images ? (data.images || data.extracted_data?.images || []) : [],
      metadata: data.metadata || data.extracted_data?.metadata || {},
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