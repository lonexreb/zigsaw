# `UniversalAgent` Node — *AI Models*

> Claude-powered reasoning node. Single config covers Opus / Sonnet / Haiku.

## What it does

The Universal Agent is the workhorse AI node — Anthropic's Claude family in a
single configurable component. Use it whenever you need to reason over text,
generate structured output, classify, summarize, extract, or call tools.

Tool use is supported: drop nodes downstream of UniversalAgent and the model
can decide when to invoke them.

## Inputs

| Field        | Type            | Required | Description                                  |
| ------------ | --------------- | -------- | -------------------------------------------- |
| `prompt`     | `string`        | yes      | The user-facing prompt for this run          |
| `context`    | `object`        | no       | Anything you want serialized into the prompt |
| `tools`      | `Tool[]`        | no       | Wired automatically when downstream tool nodes are connected |

## Outputs

| Field        | Type            | Description                                  |
| ------------ | --------------- | -------------------------------------------- |
| `response`   | `string`        | The model's textual response                 |
| `parsed`     | `object`        | Parsed JSON if `responseFormat = json`       |
| `toolCalls`  | `ToolCall[]`    | Tool invocations the model issued            |
| `usage`      | `object`        | `{ inputTokens, outputTokens, costUsd }`     |

## Configuration

| Field            | Type     | Default                 | Description                                |
| ---------------- | -------- | ----------------------- | ------------------------------------------ |
| `model`          | enum     | `claude-sonnet-4-6`     | Variant: opus / sonnet / haiku             |
| `temperature`    | number   | `0.7`                   | 0–1                                        |
| `maxTokens`      | number   | `1024`                  | Output cap                                 |
| `systemPrompt`   | string   | —                       | Optional system message                    |
| `responseFormat` | enum     | `text`                  | `text` / `json`                            |
| `streaming`      | bool     | `true`                  | Stream partials to MetricsPanel            |

## Authentication

Server-side `ANTHROPIC_API_KEY`. BYO via the **API Keys** panel for users who
want to use their own quota.

## Example workflow

```
Trigger (webhook) → UniversalAgent (Sonnet, JSON mode) → Database (Insert)
```

A webhook posts customer feedback. Sonnet parses sentiment + intent into
structured JSON. The DB node persists the row.

## Common errors

| Error                                  | Cause                              | Fix                                         |
| -------------------------------------- | ---------------------------------- | ------------------------------------------- |
| `503 Provider not configured`          | No server `ANTHROPIC_API_KEY`      | Set the env var or BYO a key                |
| `429 Rate limit`                       | Provider throttling                | Lower throughput or upgrade tier            |
| `Output exceeded maxTokens`            | Response truncated                 | Raise `maxTokens` or instruct shorter output|
| `Failed to parse JSON`                 | `responseFormat=json`, model drift | Tighten the prompt with explicit schema     |

## Cost

Per the Anthropic price card. Live cost shows in MetricsPanel. Typical
budget: $0.001–$0.05 per call depending on tokens.

## Related nodes

- [`groq-llama`](./groq-llama.md) — cheap, fast, when accuracy matters less
- [`router`](./router.md) — branch on the agent's structured output
- [`human-in-the-loop`](./human-in-the-loop.md) — gate before destructive sinks
