# `<Node Name>` Node — *Category*

> One-sentence description of what this node does.

## What it does

A short paragraph (2–4 sentences) describing the node's purpose, when to use
it, and the kind of problems it solves. Avoid marketing copy — describe the
behavior precisely.

## Inputs

| Field        | Type            | Required | Description                                  |
| ------------ | --------------- | -------- | -------------------------------------------- |
| `inputName`  | `string`        | yes      | What this input represents                   |
| `optional`   | `number`        | no       | Default: `42`. Range: 0–100.                 |

## Outputs

| Field        | Type            | Description                                  |
| ------------ | --------------- | -------------------------------------------- |
| `result`     | `string`        | The thing you can pipe into the next node    |
| `meta`       | `object`        | Timing, cost, debug info                     |

## Configuration

| Field         | Type     | Default       | Description                          |
| ------------- | -------- | ------------- | ------------------------------------ |
| `model`       | enum     | required      | The model variant to use             |
| `temperature` | number   | `0.7`         | 0–1; higher is more creative         |

## Authentication

State exactly which API key, OAuth scope, or PAT is required, and where it
maps in the **API Keys** panel. Note the BYO-key option where applicable.

## Example workflow

```
Trigger (webhook) → <Node Name> → Output (Gmail)
```

Describe the example in 1–2 sentences. Keep it concrete.

## Common errors

| Error                              | Cause                          | Fix                                     |
| ---------------------------------- | ------------------------------ | --------------------------------------- |
| `401 Unauthorized`                 | Missing or expired key         | Re-add the key in the API Keys panel    |
| `429 Too Many Requests`            | Provider rate limit            | Lower throughput or upgrade plan        |
| `Validation failed: missing X`     | Required config not set        | Open the node sheet and fill the field  |

## Cost

Typical cost per run: **$X.XX** (varies by input size). The MetricsPanel shows
the live cost during execution.

## Related nodes

- [`OtherNode`](./other-node.md) — when to use that one instead
- [`UpstreamNode`](./upstream-node.md) — what typically feeds this one
