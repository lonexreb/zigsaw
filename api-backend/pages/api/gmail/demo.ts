import { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const baseUrl = req.headers.host?.includes('localhost') 
    ? 'http://localhost:3000'
    : 'https://zigsaw-backend.vercel.app'

  return res.json({
    title: "Gmail API Operations - Available Endpoints",
    description: "These endpoints use your Gmail OAuth tokens for email automation",
    authentication: "Requires Google OAuth sign-in via /api/auth/signin/google",
    endpoints: {
      "1. List Labels": {
        url: `${baseUrl}/api/gmail/list-labels`,
        method: "GET",
        description: "Get all Gmail labels (INBOX, STARRED, custom labels)",
        example: "curl -X GET '${baseUrl}/api/gmail/list-labels' --cookie 'session-token=...'",
        response: "Returns system labels (INBOX, SENT, etc.) and custom labels"
      },
      "2. List Emails": {
        url: `${baseUrl}/api/gmail/list-emails`,
        method: "GET",
        description: "List emails with optional search and filtering",
        parameters: {
          maxResults: "Number of emails (1-50, default: 10)",
          q: "Gmail search query (e.g., 'is:unread from:someone@email.com')",
          labelIds: "Filter by label IDs"
        },
        examples: [
          `${baseUrl}/api/gmail/list-emails?maxResults=5`,
          `${baseUrl}/api/gmail/list-emails?q=is:unread`,
          `${baseUrl}/api/gmail/list-emails?labelIds=INBOX&maxResults=3`
        ]
      },
      "3. Label Email": {
        url: `${baseUrl}/api/gmail/label-email`,
        method: "POST",
        description: "Add or remove labels from specific emails",
        body: {
          messageId: "Required: Gmail message ID",
          action: "Required: 'add' or 'remove'",
          labelIds: "Required: Array of label IDs (e.g., ['STARRED', 'IMPORTANT'])"
        },
        examples: {
          starEmail: {
            messageId: "18c1234567890abcd",
            action: "add",
            labelIds: ["STARRED"]
          },
          markImportant: {
            messageId: "18c1234567890abcd", 
            action: "add",
            labelIds: ["IMPORTANT"]
          },
          removeFromInbox: {
            messageId: "18c1234567890abcd",
            action: "remove", 
            labelIds: ["INBOX"]
          }
        }
      },
      "4. Draft Reply": {
        url: `${baseUrl}/api/gmail/draft-reply`,
        method: "POST", 
        description: "Create draft replies to emails",
        body: {
          threadId: "Required: Gmail thread ID",
          to: "Required: Recipient email",
          subject: "Required: Reply subject",
          body: "Required: Reply content",
          inReplyTo: "Optional: Original message ID", 
          references: "Optional: Message references"
        },
        example: {
          threadId: "18c1234567890abcd",
          to: "someone@example.com",
          subject: "Re: Original Subject",
          body: "Thanks for your email! I'll get back to you soon."
        }
      }
    },
    workflow_examples: {
      "Auto-Star Important Emails": {
        description: "Automatically star emails from specific senders",
        steps: [
          "1. GET /api/gmail/list-emails?q=from:boss@company.com",
          "2. For each message: POST /api/gmail/label-email with action='add' and labelIds=['STARRED']"
        ]
      },
      "Auto-Reply to Specific Emails": {
        description: "Create draft replies for emails with specific keywords",
        steps: [
          "1. GET /api/gmail/list-emails?q=is:unread subject:urgent",
          "2. For each message: POST /api/gmail/draft-reply with auto-generated response"
        ]
      },
      "Email Organization": {
        description: "Organize emails by moving them to appropriate labels",
        steps: [
          "1. GET /api/gmail/list-labels to see available labels",
          "2. GET /api/gmail/list-emails with search criteria",
          "3. POST /api/gmail/label-email to organize emails"
        ]
      }
    },
    testing: {
      prerequisite: "Sign in first: Visit ${baseUrl}/api/auth/signin/google",
      test_flow: [
        "1. Sign in with Google OAuth",
        "2. Test /api/gmail/list-labels to see available labels", 
        "3. Test /api/gmail/list-emails to get message IDs",
        "4. Use message IDs to test labeling and draft replies"
      ]
    },
    note: "All endpoints require valid Gmail OAuth tokens from NextAuth session"
  })
}
