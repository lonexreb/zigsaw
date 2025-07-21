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
    const { apiKey, url = 'https://httpbin.org/html' } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'Missing API key' });
    }

    console.log('=== Firecrawl Debug Session ===');
    console.log('API Key (first 10 chars):', apiKey.substring(0, 10) + '...');
    console.log('Test URL:', url);

    // Validate API key format
    if (!apiKey.startsWith('fc-')) {
      return res.status(400).json({ 
        error: 'Invalid API key format',
        details: 'Firecrawl API keys should start with "fc-"',
        apiKeyPrefix: apiKey.substring(0, 5)
      });
    }

    const endpoints = [
      'https://api.firecrawl.dev/scrape',
      'https://api.firecrawl.dev/v1/scrape',
      'https://api.firecrawl.dev/api/scrape',
      'https://api.firecrawl.dev/v1/extract',
      'https://api.firecrawl.dev/extract'
    ];

    const results = [];

    for (const endpoint of endpoints) {
      console.log(`\n--- Testing endpoint: ${endpoint} ---`);
      
      let testPayloads;
      
      if (endpoint.includes('/extract')) {
        // For extract endpoints
        testPayloads = [
          { url: url },
          { url: url, extraction_prompt: "Extract the main content from this webpage", output_format: "markdown" },
          { url: url, extraction_prompt: "Get the title and content", output_format: "text" }
        ];
      } else {
        // For scrape endpoints
        testPayloads = [
          { url: url },
          { url: url, format: 'markdown' },
          { url: url, format: 'markdown', only_main_content: true },
          { url: url, extract_text: true }
        ];
      }

      for (let i = 0; i < testPayloads.length; i++) {
        const payload = testPayloads[i];
        console.log(`Test ${i + 1}:`, payload);
        
        try {
          const startTime = Date.now();
          
          const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
          });

          const endTime = Date.now();
          const responseTime = endTime - startTime;

          console.log(`Response status: ${response.status} ${response.statusText}`);
          console.log(`Response time: ${responseTime}ms`);
          console.log('Response headers:', Object.fromEntries(response.headers.entries()));

          const responseText = await response.text();
          let responseData = null;
          
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            console.log('Response is not JSON:', responseText.substring(0, 200));
          }

          const result = {
            endpoint,
            testNumber: i + 1,
            payload,
            status: response.status,
            statusText: response.statusText,
            responseTime,
            success: response.ok,
            responseData: responseData,
            rawResponse: responseText.substring(0, 500),
            headers: Object.fromEntries(response.headers.entries())
          };

          results.push(result);

          if (response.ok) {
            console.log('✅ SUCCESS with this payload!');
            return res.status(200).json({
              success: true,
              workingEndpoint: endpoint,
              workingPayload: payload,
              responseTime,
              data: responseData,
              allResults: results
            });
          } else {
            console.log('❌ Failed with this payload');
            console.log('Error details:', responseData);
          }

        } catch (error) {
          console.error('Exception during test:', error);
          results.push({
            endpoint,
            testNumber: i + 1,
            payload,
            status: 0,
            statusText: 'Exception',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    }

    // If we get here, all tests failed
    console.log('\n=== All tests failed ===');
    return res.status(400).json({
      success: false,
      error: 'All Firecrawl API tests failed',
      results: results,
      recommendations: [
        'Check if your API key is valid and has sufficient credits',
        'Verify the API key format starts with "fc-"',
        'Check if the target URL is accessible',
        'Try a different URL for testing',
        'Check Firecrawl documentation for the correct endpoint',
        'Make sure your Firecrawl account is active and has scraping permissions'
      ]
    });

  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 