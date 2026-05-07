import { NextApiRequest, NextApiResponse } from 'next';
import { rateLimit, applyHeaders } from '../../../lib/rate-limit';

// Seedance 2 (image-to-video) route — calls ByteDance / Volcano Engine ARK
// to generate a polished video scene from a reference image (typically the
// upstream Storyboard node's output) plus a text prompt.
//
// API: https://www.volcengine.com/docs/82379/1521008
// Model id: doubao-seedance-1-0-pro-250528 (Seedance 2.0 Pro).

const ARK_API_KEY_ENV = 'ARK_API_KEY';
const ARK_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
const SEEDANCE_MODEL = 'doubao-seedance-1-0-pro-250528';

// Caps on polling — generations typically finish in 30-90s.
const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

function resolveApiKey(byoKey?: string): string | null {
  const envKey = process.env[ARK_API_KEY_ENV];
  if (envKey && envKey.length > 20) return envKey;
  if (byoKey && byoKey.length > 20) return byoKey;
  return null;
}

interface CreateTaskResponse {
  id: string;
}

interface TaskStatusResponse {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  content?: { video_url?: string };
  error?: { code?: string; message?: string };
}

async function pollTask(taskId: string, apiKey: string): Promise<TaskStatusResponse> {
  const start = Date.now();
  while (Date.now() - start < POLL_TIMEOUT_MS) {
    const r = await fetch(`${ARK_BASE_URL}/contents/generations/tasks/${taskId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!r.ok) {
      const text = await r.text();
      throw new Error(`Task poll failed: ${r.status} ${text.slice(0, 200)}`);
    }
    const json = (await r.json()) as TaskStatusResponse;
    if (json.status === 'succeeded' || json.status === 'failed' || json.status === 'cancelled') {
      return json;
    }
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  throw new Error(`Generation timed out after ${POLL_TIMEOUT_MS / 1000}s`);
}

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

  // Video generation is heavier — reuse the workflow-execute bucket.
  const verdict = await rateLimit(req, { kind: 'workflow-execute' });
  applyHeaders(res, verdict);
  if (!verdict.ok) {
    return res
      .status(429)
      .json({ error: 'Rate limit exceeded', retryAfter: verdict.retryAfterSec });
  }

  try {
    const {
      prompt,
      image_url,
      duration = 5,
      resolution = '1080p',
      aspect_ratio = '16:9',
      apiKey: byoKey,
    } = req.body as {
      prompt?: string;
      image_url?: string;
      duration?: number;
      resolution?: string;
      aspect_ratio?: string;
      apiKey?: string;
    };

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Missing required parameter: prompt' });
    }
    if (!image_url || typeof image_url !== 'string') {
      return res.status(400).json({
        error: 'Missing required parameter: image_url',
        details:
          'Connect a Storyboard node (or any image-producing node) upstream, or paste a public image URL into the node settings.',
      });
    }

    const apiKey = resolveApiKey(byoKey);
    if (!apiKey) {
      return res.status(503).json({
        error: 'Seedance provider is not configured on this server.',
        details: `Set ${ARK_API_KEY_ENV} server-side, or supply a user-key in the request body.`,
      });
    }

    // Seedance prompts accept inline parameters like --resolution and --duration.
    const promptWithParams =
      `${prompt.trim()} --resolution ${resolution} --duration ${duration} --ratio ${aspect_ratio}`;

    const createResp = await fetch(`${ARK_BASE_URL}/contents/generations/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: SEEDANCE_MODEL,
        content: [
          { type: 'text', text: promptWithParams },
          { type: 'image_url', image_url: { url: image_url } },
        ],
      }),
    });

    if (!createResp.ok) {
      const errorText = await createResp.text();
      let details: string = errorText;
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) details = errorJson.error.message;
      } catch {
        // raw text already assigned
      }
      return res.status(createResp.status).json({
        error: `Upstream task creation failed: ${createResp.status} ${createResp.statusText}`,
        details,
      });
    }

    const created = (await createResp.json()) as CreateTaskResponse;
    if (!created.id) {
      return res.status(502).json({ error: 'Upstream returned no task id' });
    }

    const finalStatus = await pollTask(created.id, apiKey);

    if (finalStatus.status !== 'succeeded' || !finalStatus.content?.video_url) {
      return res.status(502).json({
        error: 'Seedance generation did not succeed',
        details:
          finalStatus.error?.message ||
          `Task ${finalStatus.id} ended with status ${finalStatus.status}`,
      });
    }

    return res.status(200).json({
      video_url: finalStatus.content.video_url,
      task_id: finalStatus.id,
      prompt,
      image_url,
      duration,
      resolution,
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
