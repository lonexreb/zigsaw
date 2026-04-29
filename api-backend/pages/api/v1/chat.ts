import { NextApiRequest, NextApiResponse } from 'next';

// Allowed AI providers — keep this in sync with frontend `getModelForProvider`.
type Provider = 'anthropic' | 'openai' | 'groq';

const PROVIDER_KEY_ENV: Record<Provider, string> = {
  anthropic: 'ANTHROPIC_API_KEY',
  openai: 'OPENAI_API_KEY',
  groq: 'GROQ_API_KEY',
};

// Resolve the API key for a provider. Server-side env wins; user-supplied (BYO)
// is accepted as a fallback so power users can use their own quota. The
// frontend MUST NOT bundle keys via Vite — this is enforced by issue #5.
function resolveApiKey(provider: Provider, byoKey?: string): string | null {
  const envKey = process.env[PROVIDER_KEY_ENV[provider]];
  if (envKey && envKey.length > 20) return envKey;
  if (byoKey && byoKey.length > 20) return byoKey;
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // CORS — tighten to allowlist in production.
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
    const {
      provider,
      model,
      messages,
      systemPrompt,
      temperature,
      maxTokens,
      apiKey: byoKey, // optional bring-your-own; never required
    } = req.body as {
      provider?: Provider;
      model?: string;
      messages?: Array<{ role: string; content: string }>;
      systemPrompt?: string;
      temperature?: number;
      maxTokens?: number;
      apiKey?: string;
    };

    if (!provider || !model || !messages) {
      return res.status(400).json({ error: 'Missing required parameters: provider, model, messages' });
    }

    if (!(provider in PROVIDER_KEY_ENV)) {
      return res.status(400).json({ error: `Unsupported provider: ${provider}` });
    }

    const apiKey = resolveApiKey(provider, byoKey);
    if (!apiKey) {
      return res.status(503).json({
        error: `Provider ${provider} is not configured on this server.`,
        details: `Set ${PROVIDER_KEY_ENV[provider]} server-side, or supply a user-key in the request body.`,
      });
    }

    let response: Response;

    switch (provider) {
      case 'anthropic':
        response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens ?? 1000,
            temperature: temperature ?? 0.7,
            // Claude doesn't take a leading system message in the array.
            messages: messages[0]?.role === 'system' ? messages.slice(1) : messages,
            system: systemPrompt ?? messages.find((m) => m.role === 'system')?.content ?? 'You are a helpful AI assistant.',
          }),
        });
        break;

      case 'openai':
        response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens ?? 1000,
            temperature: temperature ?? 0.7,
            messages,
          }),
        });
        break;

      case 'groq':
        response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens ?? 1000,
            temperature: temperature ?? 0.7,
            messages,
          }),
        });
        break;
    }

    if (!response.ok) {
      const errorText = await response.text();
      let errorDetails: string = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) errorDetails = errorJson.error.message;
      } catch {
        // raw text already assigned
      }
      return res.status(response.status).json({
        error: `Upstream request failed: ${response.status} ${response.statusText}`,
        details: errorDetails,
      });
    }

    const data = await response.json();

    let assistantContent = '';
    if (provider === 'anthropic') {
      assistantContent = data?.content?.[0]?.text ?? 'No response received';
    } else {
      assistantContent = data?.choices?.[0]?.message?.content ?? 'No response received';
    }

    return res.status(200).json({
      content: assistantContent,
      provider,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
