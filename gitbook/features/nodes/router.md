# `Router` Node — *Logic*

> Branch a workflow into multiple paths based on a condition.

## What it does

Takes a single input and routes it to one of N labeled branches. Each branch
is a conditional expression evaluated against the input. Default branch
catches anything that didn't match.

Use this **instead of** multiple parallel triggers. One trigger → one router
→ many handlers is the canonical fan-out pattern.

## Inputs

| Field        | Type     | Required | Description                                   |
| ------------ | -------- | -------- | --------------------------------------------- |
| `value`      | `any`    | yes      | The data to match against branch conditions   |

## Outputs

Each branch is a separate output port. Exactly one branch fires per run.

| Port           | Fires when…                                                  |
| -------------- | ------------------------------------------------------------ |
| `<branchName>` | The branch's condition evaluates truthy                      |
| `default`      | No branch matched                                            |

## Configuration

| Field        | Type           | Default     | Description                                |
| ------------ | -------------- | ----------- | ------------------------------------------ |
| `branches`   | `Branch[]`     | required    | Ordered list — first match wins            |
| `mode`       | enum           | `firstMatch`| `firstMatch` / `allMatch` (broadcast)      |

`Branch` shape:
```json
{
  "name": "highValue",
  "expression": "value.amount > 1000"
}
```

Expressions are JS-style and run in a sandboxed evaluator — no I/O, no
`require`, no global state.

## Authentication

None.

## Example workflow

```
Trigger → UniversalAgent (classify) → Router
   ├─ urgent  → Slack (page on-call)
   ├─ refund  → Stripe (process refund) → Gmail (confirm)
   └─ default → Gmail (acknowledge)
```

## Common errors

| Error                              | Cause                            | Fix                                       |
| ---------------------------------- | -------------------------------- | ----------------------------------------- |
| `Expression syntax error`          | Branch expression won't parse    | Test in the inline expression sandbox     |
| `Reference error: x is not defined`| Branch reads missing input field | Validate input shape upstream             |
| `No branch matched, no default`    | All branches missed              | Add a `default` branch                    |

## Cost

Free.

## Related nodes

- [`loop`](./loop.md) — repeat downstream nodes per item
- [`human-in-the-loop`](./human-in-the-loop.md) — pause + ask before risky branches
