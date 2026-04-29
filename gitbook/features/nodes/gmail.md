# `Gmail` Node — *Integrations*

> Read inbox · search · send · reply.

## What it does

OAuth2-backed Gmail integration. Configure it once via the Google flow; reuse
it across every workflow. Two action modes: **read** (search/fetch) and
**send** (draft/reply).

## Inputs

| Field         | Type                   | Required | Description                              |
| ------------- | ---------------------- | -------- | ---------------------------------------- |
| `to`          | `string \| string[]`   | send     | Recipient(s)                             |
| `subject`     | `string`               | send     | Subject line                             |
| `body`        | `string`               | send     | Plain text or HTML                       |
| `query`       | `string`               | read     | Gmail search query (`from:x is:unread`)  |
| `replyToId`   | `string`               | reply    | Message id to thread on                  |

## Outputs

### Send mode
| Field        | Type     | Description                                         |
| ------------ | -------- | --------------------------------------------------- |
| `messageId`  | `string` | Sent message id                                     |
| `threadId`   | `string` | Thread the message landed in                        |

### Read mode
| Field        | Type             | Description                                  |
| ------------ | ---------------- | -------------------------------------------- |
| `messages`   | `Message[]`      | Matched messages (most recent first)         |
| `nextPageToken` | `string`      | Pagination cursor                            |

## Configuration

| Field          | Type     | Default     | Description                              |
| -------------- | -------- | ----------- | ---------------------------------------- |
| `mode`         | enum     | `send`      | `send` / `read` / `reply`                |
| `account`      | string   | required    | Google account email (selected via OAuth)|
| `format`       | enum     | `text`      | `text` / `html` (send mode)              |
| `maxResults`   | number   | `10`        | Page size (read mode)                    |

## Authentication

Google OAuth2. The Gmail tab in the **API Keys** panel walks the user through
consent. The token is encrypted via the secrets vault (issue #6).

Required scopes:
- `gmail.send` for send/reply
- `gmail.readonly` for read

## Example workflow

```
Trigger (Gmail: new message in #support) → UniversalAgent (classify intent) → Gmail (send draft reply)
```

Watch the support inbox, classify intent, draft a reply for human review.

## Common errors

| Error                              | Cause                          | Fix                                       |
| ---------------------------------- | ------------------------------ | ----------------------------------------- |
| `401 Invalid credentials`          | OAuth token expired            | Re-authorize from API Keys panel          |
| `403 Insufficient scopes`          | Missing scope                  | Re-consent and grant the missing scope    |
| `400 Invalid recipient`            | Malformed `to` field           | Validate emails before the node           |
| `Quota exceeded`                   | Daily Gmail send cap hit       | Wait / use SendGrid integration           |

## Cost

Free at the Zigsaw layer. Google's Gmail API is free up to the standard quota.

## Related nodes

- [`google-calendar`](./google-calendar.md) — meeting + invite automation
- [`document`](./document.md) — parse attachments before/after Gmail
- [`router`](./router.md) — branch on classified intent
