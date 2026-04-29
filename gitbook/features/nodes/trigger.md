# `Trigger` Node — *Triggers*

> Starts every workflow. Manual, webhook, schedule, or external event.

## What it does

The Trigger node is the entry point of every workflow. It defines *when* the
workflow runs. Zigsaw rejects any workflow that doesn't begin with a trigger.

Four trigger types in one node — pick the mode in the node config.

## Modes

### Manual
Runs only when the user clicks **Run** in the canvas or hits the deployed API
endpoint with `POST /w/<slug>`.

### Webhook
Generates a stable URL on deploy. Any external service can `POST` JSON to that
URL to start the workflow. The body becomes the trigger output.

### Schedule
Cron expression. Runs in the executor's timezone (UTC by default).

### Email
Inbound email address. The parsed message becomes the trigger output:
`{ from, subject, body, attachments }`.

## Inputs

None — Triggers consume external events, not pipeline data.

## Outputs

| Field        | Type     | Description                                            |
| ------------ | -------- | ------------------------------------------------------ |
| `payload`    | `object` | The body of the triggering event                       |
| `headers`    | `object` | Headers (webhook) or message headers (email)           |
| `firedAt`    | `string` | ISO timestamp the trigger fired                        |
| `runId`      | `string` | The workflow run identifier                            |

## Configuration

| Field                | Type        | Default    | Description                          |
| -------------------- | ----------- | ---------- | ------------------------------------ |
| `mode`               | enum        | `manual`   | `manual` / `webhook` / `schedule` / `email` |
| `cron`               | string      | —          | Cron expression (mode=schedule)      |
| `timezone`           | string      | `UTC`      | IANA timezone (mode=schedule)        |
| `validateSchema`     | object      | —          | Zod schema. Reject mismatching payloads. |

## Authentication

- **Manual**: requires a logged-in user.
- **Webhook**: deployed endpoint requires `Authorization: Bearer <ZIGSAW_KEY>`.
- **Schedule**: server-side, no auth needed.
- **Email**: emails to the generated `<slug>@in.figsaw.dev` address.

## Example workflow

```
Trigger (webhook) → Universal Agent (Claude) → Gmail (Send)
```

POST a JSON body to the webhook URL → Claude reasons over it → Gmail sends a
formatted reply.

## Common errors

| Error                              | Cause                            | Fix                                       |
| ---------------------------------- | -------------------------------- | ----------------------------------------- |
| `Workflow has no trigger`          | Canvas has no trigger node       | Drop a Trigger from the Node Panel        |
| `Multiple triggers found`          | Two trigger nodes on the canvas  | Use a Router after a single trigger       |
| `Invalid cron expression`          | Schedule mode + bad `cron`       | Validate at https://crontab.guru          |
| `Payload validation failed`        | Schema set, body doesn't match   | Inspect run log; fix sender or schema     |

## Cost

Free. Trigger nodes don't call provider APIs.

## Related nodes

- [`router`](./router.md) — branch downstream paths conditionally
- [`human-in-the-loop`](./human-in-the-loop.md) — pause for approval
