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
    { "id": "trigger-1", "type": "trigger", "position": { "x": 100, "y": 100 }, "data": { "label": "When I get an email", "description": "Trigger when a new email is received", "status": "idle" } },
    { "id": "router-2", "type": "router", "position": { "x": 300, "y": 100 }, "data": { "label": "Router", "description": "Route based on ...", "status": "idle" } },
    { "id": "universal_agent-3", "type": "universal_agent", "position": { "x": 600, "y": 60 }, "data": { "label": "Summarize Email", "description": "Summarize the email", "status": "idle" } },
    { "id": "universal_agent-4", "type": "universal_agent", "position": { "x": 600, "y": 100 }, "data": { "label": "Translate Email", "description": "Translate the email", "status": "idle" } },
    { "id": "universal_agent-5", "type": "universal_agent", "position": { "x": 600, "y": 140 }, "data": { "label": "Extract Dates", "description": "Extract dates from the email", "status": "idle" } }
  ],
  "edges": [
    { "id": "e1", "source": "trigger-1", "target": "router-2" },
    { "id": "e2", "source": "router-2", "target": "universal_agent-3", "sourceHandle": "path-a" },
    { "id": "e3", "source": "router-2", "target": "universal_agent-4", "sourceHandle": "path-b" },
    { "id": "e4", "source": "router-2", "target": "universal_agent-5", "sourceHandle": "path-c" }
  ]
}

- Only use these node types: trigger, universal_agent, router.
- Node IDs must be in the format: 'trigger-#', 'universal_agent-#', 'router-#' (where # is a unique number 1-10).
- When using a router node, always create three outputs: path A, path B, path C.
- Each output path must connect to exactly one universal_agent node, and no two agent nodes connect to the same path.
- Use the sourceHandle field in edges to indicate which router output is used (e.g., 'path-a', 'path-b', 'path-c').
- The trigger node's label and description must be unique and reflect the workflow's purpose (e.g., 'When I get an email').
- You may use multiple universal_agent or router nodes as needed for the workflow.
- Do not use any other node types or IDs.
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