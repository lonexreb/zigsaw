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

    // For now, accept the API key as valid if it has the correct format
    // The actual validation will happen when making real scraping requests
    return res.status(200).json({ 
      valid: true, 
      message: 'API key format is valid (will be tested on first use)',
      note: 'Actual API validation will occur when making scraping requests'
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