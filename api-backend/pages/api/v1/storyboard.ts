import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, applyHeaders } from '../../../lib/rate-limit';
import {
  buildStoryboardPrompt,
  StoryboardStyle,
} from '../../../lib/storyboard-template';

// Storyboard generation route — calls OpenAI's gpt-image-1 to render an
// Arcads-style 12-frame storyboard sheet. Server env wins; user BYO key
// accepted as fallback (mirrors chat.ts:16-21).

const OPENAI_API_KEY_ENV = 'OPENAI_API_KEY';

function resolveApiKey(byoKey?: string): string | null {
  const envKey = process.env[OPENAI_API_KEY_ENV];
  if (envKey && envKey.length > 20) return envKey;
  if (byoKey && byoKey.length > 20) return byoKey;
  return null;
}

const ALLOWED_SIZES = new Set(['1024x1024', '1536x1024', '1024x1536']);
const ALLOWED_STYLES: ReadonlySet<StoryboardStyle> = new Set([
  'cinematic',
  'animated',
  'sketch',
]);

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

  const verdict = await rateLimit(req, { kind: 'chat' });
  applyHeaders(res, verdict);
  if (!verdict.ok) {
    return res
      .status(429)
      .json({ error: 'Rate limit exceeded', retryAfter: verdict.retryAfterSec });
  }

  try {
    const {
      prompt,
      use_template = true,
      frame_count = 12,
      style = 'cinematic',
      aspect_ratio = '16:9',
      apiKey: byoKey,
    } = req.body as {
      prompt?: string;
      use_template?: boolean;
      frame_count?: number;
      style?: StoryboardStyle;
      aspect_ratio?: string;
      apiKey?: string;
    };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res
        .status(400)
        .json({ error: 'Missing required parameter: prompt' });
    }

    if (style && !ALLOWED_STYLES.has(style)) {
      return res.status(400).json({ error: `Unsupported style: ${style}` });
    }

    const apiKey = resolveApiKey(byoKey);
    if (!apiKey) {
      return res.status(503).json({
        error: 'Storyboard provider is not configured on this server.',
        details: `Set ${OPENAI_API_KEY_ENV} server-side, or supply a user-key in the request body.`,
      });
    }

    // Build the final prompt: either the Arcads-style 12-frame meta-prompt,
    // or the user's raw prompt verbatim ("raw mode" toggle from the node UI).
    const finalPrompt = use_template
      ? buildStoryboardPrompt({ idea: prompt, frameCount: frame_count, style })
      : prompt.trim();

    // gpt-image-1 doesn't take aspect_ratio; map it to the closest size.
    const size =
      aspect_ratio === '9:16'
        ? '1024x1536'
        : aspect_ratio === '1:1'
          ? '1024x1024'
          : '1536x1024';
    const safeSize = ALLOWED_SIZES.has(size) ? size : '1536x1024';

    const upstream = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-image-1',
        prompt: finalPrompt,
        size: safeSize,
        n: 1,
      }),
    });

    if (!upstream.ok) {
      const errorText = await upstream.text();
      let details: string = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) details = errorJson.error.message;
      } catch {
        // raw text already assigned
      }
      return res.status(upstream.status).json({
        error: `Upstream image request failed: ${upstream.status} ${upstream.statusText}`,
        details,
      });
    }

    const data = await upstream.json();
    const first = data?.data?.[0];
    // gpt-image-1 returns either a URL or a base64-encoded image.
    let image_url: string | undefined = first?.url;
    if (!image_url && first?.b64_json) {
      image_url = `data:image/png;base64,${first.b64_json}`;
    }

    if (!image_url) {
      return res.status(502).json({
        error: 'Upstream returned no image data',
        details: JSON.stringify(data).slice(0, 500),
      });
    }

    return res.status(200).json({
      image_url,
      prompt: finalPrompt,
      original_prompt: prompt,
      use_template,
      frame_count,
      style,
      aspect_ratio,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
