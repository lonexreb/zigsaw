# Gmail Workflow Nodes

Two new workflow nodes for Gmail automation:

## 1. Gmail Label Email Node

**Purpose**: Add or remove labels from emails automatically

**Inputs**: 
- Email data from previous nodes (messageId, threadId)
- Manual message ID entry

**Configuration**:
- Action: Add or Remove labels
- Label selection: Star, Important, Trash, Spam, Inbox, etc.
- Message ID source: From previous node or manual entry

**Use Cases**:
- Auto-star emails from VIP senders
- Move emails to trash based on keywords
- Organize emails by automatically applying custom labels
- Bulk email management

## 2. Gmail Draft Reply Node

**Purpose**: Create automated draft replies to emails

**Inputs**:
- Email data from previous nodes (from, subject, threadId)
- Recipient and thread information

**Configuration**:
- Subject template (with variables like {{subject}})
- Body template (with variables like {{from}}, {{subject}})
- Recipient source: From previous node or manual entry
- Thread ID source: From previous node or manual entry

**Use Cases**:
- Auto-reply drafts for common inquiries
- Template responses for customer service
- Out-of-office style automated responses
- Follow-up email drafts

## Workflow Examples

### Example 1: VIP Email Management
```
Gmail List Emails (from:boss@company.com) 
  → Gmail Label Email (Add: STARRED, IMPORTANT)
  → Gmail Draft Reply (Subject: "Re: {{subject}}", Body: "I'll review this immediately...")
```

### Example 2: Customer Service Automation
```
Gmail List Emails (is:unread subject:support) 
  → Gmail Label Email (Add: SUPPORT_QUEUE)
  → Gmail Draft Reply (Template response acknowledging receipt)
```

### Example 3: Email Organization
```
Gmail List Emails (from:notifications) 
  → Gmail Label Email (Remove: INBOX, Add: NOTIFICATIONS)
```

## API Dependencies

These nodes use the Gmail API endpoints:
- `POST /api/gmail/label-email` - For labeling operations
- `POST /api/gmail/draft-reply` - For creating drafts
- Requires Gmail OAuth authentication via NextAuth

## Testing

1. Sign in with Google OAuth first
2. Use "Gmail List Emails" node to get message data
3. Connect output to either labeling or draft reply nodes
4. Configure actions and templates
5. Execute workflow to see results in Gmail
