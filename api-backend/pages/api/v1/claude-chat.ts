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
      content: `You are a workflow generator. Given a user request, output ONLY a JSON object describing a workflow for a drag-and-drop canvas. The JSON must have this format:\n\n{\n  \"nodes\": [\n    { \"id\": \"trigger-1\", \"type\": \"GmailEmailReceivedNode\", \"position\": { \"x\": 100, \"y\": 100 }, \"data\": { \"label\": \"When email received\", \"description\": \"...\", \"status\": \"idle\" } },\n    { \"id\": \"agent-1\", \"type\": \"UniversalAgentNode\", \"position\": { \"x\": 400, \"y\": 100 }, \"data\": { \"label\": \"Summarize with AI\", \"description\": \"...\", \"status\": \"idle\" } },\n    { \"id\": \"action-1\", \"type\": \"SlackSendMessageNode\", \"position\": { \"x\": 700, \"y\": 100 }, \"data\": { \"label\": \"Send Slack message\", \"description\": \"...\", \"status\": \"idle\" } }\n  ],\n  \"edges\": [\n    { \"id\": \"e1\", \"source\": \"trigger-1\", \"target\": \"agent-1\" },\n    { \"id\": \"e2\", \"source\": \"agent-1\", \"target\": \"action-1\" }\n  ]\n}\n\nDo not include any explanation, markdown, or code block. Only output the JSON object.`
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