import { NextApiRequest, NextApiResponse } from 'next'

// Gmail Tool Definitions for Universal Agent Node
export const GMAIL_TOOLS = [
  {
    id: 'gmail_list_emails',
    name: 'gmail_list_emails',
    description: 'List and search emails from Gmail with optional filters',
    parameters: [
      {
        name: 'maxResults',
        type: 'number',
        description: 'Maximum number of emails to return (1-50, default: 10)',
        required: false,
        default: 10
      },
      {
        name: 'q',
        type: 'string', 
        description: 'Gmail search query (e.g., "is:unread", "from:boss@company.com", "subject:urgent")',
        required: false
      },
      {
        name: 'labelIds',
        type: 'array',
        description: 'Filter by label IDs (e.g., ["INBOX", "STARRED"])',
        required: false
      }
    ],
    examples: [
      'List recent emails: { "maxResults": 5 }',
      'Find unread emails: { "q": "is:unread", "maxResults": 10 }',
      'Emails from specific sender: { "q": "from:boss@company.com" }',
      'Starred emails: { "labelIds": ["STARRED"] }'
    ]
  },
  {
    id: 'gmail_list_labels',
    name: 'gmail_list_labels', 
    description: 'Get all Gmail labels (INBOX, SENT, STARRED, custom labels) for the user',
    parameters: [],
    examples: [
      'Get all labels: {} (no parameters needed)'
    ]
  },
  {
    id: 'gmail_label_email',
    name: 'gmail_label_email',
    description: 'Add or remove labels from specific emails (star, archive, mark important, etc.)',
    parameters: [
      {
        name: 'messageId',
        type: 'string',
        description: 'Gmail message ID (get from gmail_list_emails)',
        required: true
      },
      {
        name: 'action', 
        type: 'string',
        description: 'Action to perform: "add" or "remove"',
        required: true,
        enum: ['add', 'remove']
      },
      {
        name: 'labelIds',
        type: 'array',
        description: 'Array of label IDs to add/remove (e.g., ["STARRED", "IMPORTANT"])',
        required: true
      }
    ],
    examples: [
      'Star an email: { "messageId": "18c123...", "action": "add", "labelIds": ["STARRED"] }',
      'Mark as important: { "messageId": "18c123...", "action": "add", "labelIds": ["IMPORTANT"] }',
      'Archive email: { "messageId": "18c123...", "action": "remove", "labelIds": ["INBOX"] }',
      'Unstar email: { "messageId": "18c123...", "action": "remove", "labelIds": ["STARRED"] }'
    ]
  },
  {
    id: 'gmail_draft_reply',
    name: 'gmail_draft_reply',
    description: 'Create draft replies to emails automatically',
    parameters: [
      {
        name: 'threadId',
        type: 'string', 
        description: 'Gmail thread ID (get from gmail_list_emails message details)',
        required: true
      },
      {
        name: 'to',
        type: 'string',
        description: 'Recipient email address',
        required: true
      },
      {
        name: 'subject',
        type: 'string',
        description: 'Reply subject line (usually "Re: Original Subject")',
        required: true
      },
      {
        name: 'body',
        type: 'string',
        description: 'Reply message content',
        required: true
      },
      {
        name: 'inReplyTo',
        type: 'string',
        description: 'Original message ID for proper reply threading',
        required: false
      },
      {
        name: 'references',
        type: 'string',
        description: 'Message references for threading',
        required: false
      }
    ],
    examples: [
      'Auto-reply to support: { "threadId": "18c123...", "to": "customer@example.com", "subject": "Re: Support Request", "body": "Thank you for contacting us..." }',
      'Draft response: { "threadId": "18c123...", "to": "colleague@company.com", "subject": "Re: Meeting", "body": "I\'ll review and get back to you." }'
    ]
  }
]

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  return res.json({
    title: 'Gmail Tools for Universal Agent Node',
    description: 'Tool definitions for Gmail automation in Universal Agent workflows',
    authentication: 'Requires Google OAuth via /api/auth/signin/google',
    tools: GMAIL_TOOLS,
    usage: {
      note: 'Add these tool IDs to your Universal Agent Node configuration',
      toolIds: GMAIL_TOOLS.map(tool => tool.id),
      example_config: {
        nodeType: 'universal-agent',
        config: {
          provider: 'anthropic',
          model: 'claude-3-sonnet-20240229',
          systemPrompt: 'You are a Gmail automation assistant. Help users manage their emails efficiently.',
          tools: ['gmail_list_emails', 'gmail_list_labels', 'gmail_label_email', 'gmail_draft_reply']
        }
      }
    },
    workflow_examples: {
      'Auto-Star Important Emails': {
        description: 'Automatically star emails from important senders',
        prompt: 'Star all unread emails from my boss (boss@company.com)',
        workflow: [
          '1. Use gmail_list_emails with q="is:unread from:boss@company.com"',
          '2. For each email, use gmail_label_email with action="add" and labelIds=["STARRED"]'
        ]
      },
      'Auto-Reply to Support': {
        description: 'Create draft replies for customer support emails',
        prompt: 'Create polite draft replies for all unread support emails',
        workflow: [
          '1. Use gmail_list_emails with q="is:unread to:support@company.com"',
          '2. For each email, use gmail_draft_reply with professional response'
        ]
      },
      'Email Organization': {
        description: 'Organize emails by moving them to appropriate labels',
        prompt: 'Archive all newsletter emails and star urgent ones',
        workflow: [
          '1. Use gmail_list_emails with q="is:unread subject:newsletter"',
          '2. Use gmail_label_email to remove INBOX label (archive)',
          '3. Use gmail_list_emails with q="is:unread subject:urgent"', 
          '4. Use gmail_label_email to add STARRED label'
        ]
      }
    }
  })
}
