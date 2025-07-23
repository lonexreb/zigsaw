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
    const { provider, model, messages, systemPrompt, temperature, maxTokens, apiKey } = req.body;

    // For groq, do not require apiKey from client; use env var
    if (!provider || !model || !messages || (provider !== 'groq' && !apiKey)) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    let response;

    switch (provider) {
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: messages.slice(1), // Claude doesn't use system message in the same way
            system: systemPrompt || 'You are a helpful AI assistant.'
          })
        });
        break;

      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: messages
          })
        });
        break;

      case 'groq': {
        // Use GROQ_API_KEY from environment, not from client
        const groqApiKey = process.env.GROQ_API_KEY;
        if (!groqApiKey) {
          return res.status(500).json({ error: 'GROQ_API_KEY not set in backend environment' });
        }
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${groqApiKey}`
          },
          body: JSON.stringify({
            model: model,
            max_tokens: maxTokens || 1000,
            temperature: temperature || 0.7,
            messages: messages
          })
        });
        break;
      }

      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API request failed: ${response.status} ${response.statusText}`, errorText);
      
      // Try to parse error details for better user feedback
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
        error: `API request failed: ${response.status} ${response.statusText}`,
        details: errorDetails
      });
    }

    const data = await response.json();
    
    // Extract response content based on provider
    let assistantContent = '';
    if (provider === 'anthropic') {
      assistantContent = data.content[0]?.text || 'No response received';
    } else {
      assistantContent = data.choices[0]?.message?.content || 'No response received';
    }

    res.status(200).json({ 
      content: assistantContent,
      provider,
      model,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
} 