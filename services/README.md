# Zigsaw Microservices

The four services that power the **Creative Engine** track from
[`ONE-STOP-WORKFLOW.md`](../ONE-STOP-WORKFLOW.md) §4. Layout follows the
Turbo monorepo pattern from `lonexreb/zigsaw-labs`.

| Service        | Path                       | Responsibility                                                 |
| -------------- | -------------------------- | -------------------------------------------------------------- |
| `generation`   | [`./generation/`](./generation/)   | LLM (Anthropic) + video (Veo3) behind hexagonal ports     |
| `publishing`   | [`./publishing/`](./publishing/)   | Multi-platform publish: TikTok / Reels / Shorts / Meta / LI |
| `campaign`     | [`./campaign/`](./campaign/)       | Orchestrator — variant generation, A/B, winner selection  |
| `metrics`      | [`./metrics/`](./metrics/)         | Per-post performance ingestion + reinforcement scoring    |

## Closes issue #4

[MERGE] Port AI ad creative pipeline (Veo3 + multi-platform publish + perf
metrics) from `zigsaw-labs`.

### What's ported

- `generation/` — `LLMPort`, `LLMFactory`, `AnthropicAdapter`, `ComposePrompt`
  (lifted directly from `zigsaw-labs/services/generation`)
- `generation/src/ports/VideoPort.ts` — new abstraction
- `generation/src/adapters/video/Veo3Adapter.ts` — Google Veo 3 implementation
- `publishing/src/index.ts` — fan-out service + `PublishPort` interface
- `campaign/src/index.ts` — Campaign + Variant types, `selectWinners`
- `metrics/src/index.ts` — `MetricsAggregator`, `MetricsPort`, `MetricsRepository`

### What's pending

- Per-platform publish adapters (TikTok / Reels / Shorts / Meta / LinkedIn API
  shells). Each is a small adapter file under `publishing/src/adapters/`.
- Per-platform metrics adapters (TikTok analytics, IG insights, YT analytics).
- Persistence — Firestore-backed `CampaignRepository` / `VariantRepository`.
- Frontend node UI: `AdPromptOptimizerNode`, `ApprovalGateNode`,
  `MultiPlatformPublishNode`, `PerformanceTrackerNode`, `ReinforcementLoopNode`.
- Wiring into the workflow engine so a campaign is just another runnable graph.

These are tracked as follow-ups in successor issues.

## Architecture pattern

Hexagonal (Ports & Adapters):

```
   Application (use-cases)
       │
       ▼
     Ports     ←  interfaces
       ▲
       │
    Adapters  ←  concrete implementations (Anthropic, Veo3, TikTok, …)
```

Swap any adapter without touching the rest of the system. Test the use-cases
in isolation by injecting in-memory adapters.
