import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Set CORS headers for production
  res.setHeader('Access-Control-Allow-Origin', 'https://zigsaw.dev')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    res.status(401).json({ error: 'Missing Claude API key in backend env' })
    return
  }

  try {
    // Ensure model and max_tokens are set
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    if (!body.model) body.model = 'claude-3-haiku-20240307';
    if (!body.max_tokens) body.max_tokens = 1024;

    // Prepend workflow instruction as a user message
    const workflowInstruction = {
      role: "user",
      content: `You are a workflow generator. Given a user request, output ONLY a JSON object describing a workflow for a drag-and-drop canvas. The JSON must have this format:

{
  "nodes": [
    { "id": "trigger-1", "type": "trigger", "position": { "x": 100, "y": 100 }, "data": { "label": "Trigger", "description": "...", "status": "idle" } },
    { "id": "universal_agent-2", "type": "universal_agent", "position": { "x": 400, "y": 100 }, "data": { "label": "AI Agent", "description": "...", "status": "idle" } },
    { "id": "router-4", "type": "router", "position": { "x": 700, "y": 100 }, "data": { "label": "Router", "description": "...", "status": "idle" } }
  ],
  "edges": [
    { "id": "e1", "source": "trigger-1", "target": "universal_agent-2" },
    { "id": "e2", "source": "universal_agent-2", "target": "router-4" }
  ]
}

- Only use these node types: trigger, universal_agent, router.
- Node IDs must be in the format: 'trigger-#', 'universal_agent-#', 'router-#' (where # is a unique number 1-10).
- You may use multiple universal_agent or router nodes as needed for the workflow.
- Do not use any other node types or IDs.
- For a workflow like "When I get an email, summarize it with AI and send to Slack", use a trigger node for the email event, a universal_agent node for summarization, and another universal_agent node for sending to Slack.
- Do not include any explanation, markdown, or code block. Only output the JSON object.`
    };
    body.messages = [workflowInstruction, ...(body.messages || [])];

    const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body)
    })
    const data = await anthropicRes.json()
    res.status(anthropicRes.status).json(data)
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
} 