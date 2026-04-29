# ONE-STOP-WORKFLOW.md

> The complete operating loop for **Zigsaw** — from first sentence typed to a deployed, monitored, self-optimizing automation. Synthesized from the unified zigsaw repos and the best patterns of Zapier, n8n, Make.com, Flowise, Langflow, Dify, Activepieces, Pipedream, Temporal, AgentOps, and modern AI agent platforms.

---

## Table of Contents

- [0. The Loop in One Picture](#0-the-loop-in-one-picture)
- [1. The 60-Second Quickstart](#1-the-60-second-quickstart)
- [2. Track A — Chat-to-Workflow](#2-track-a--chat-to-workflow)
- [3. Track B — Visual Editor](#3-track-b--visual-editor)
- [4. Track C — Creative Engine (Ads)](#4-track-c--creative-engine-ads)
- [5. Track D — GitHub Co-pilot](#5-track-d--github-co-pilot)
- [6. The Execution Lifecycle](#6-the-execution-lifecycle)
- [7. Deploy Any Workflow as a Live API](#7-deploy-any-workflow-as-a-live-api)
- [8. Monitoring, Metrics & Cost Control](#8-monitoring-metrics--cost-control)
- [9. Integrations Catalog](#9-integrations-catalog)
- [10. The Compounding Optimization Loop](#10-the-compounding-optimization-loop)
- [11. Pricing, Credits & Trial](#11-pricing-credits--trial)
- [12. Enterprise Path](#12-enterprise-path)
- [13. Reference Architecture (Unified)](#13-reference-architecture-unified)
- [14. Best Practices & Anti-Patterns](#14-best-practices--anti-patterns)
- [15. Appendix — Where Each Track Came From](#15-appendix--where-each-track-came-from)

---

## 0. The Loop in One Picture

```
   ┌─────────────────────────────────────────────────────────────────┐
   │                                                                 │
   │   IDEA   →   DESCRIBE   →   GENERATE   →   REFINE   →   DEPLOY  │
   │     ▲                                                       │   │
   │     │                                                       ▼   │
   │   LEARN   ←   OPTIMIZE   ←   MEASURE   ←   RUN   ←   PUBLISH    │
   │                                                                 │
   └─────────────────────────────────────────────────────────────────┘

Every Zigsaw user, every workflow, every team rides the same loop. The
platform's job is to make each leg of the loop frictionless and to
compound learning across runs.
```

The four tracks (Chat, Visual, Creative, GitHub) are different **on-ramps** to the same loop. They share the same execution engine, the same observability surface, and the same auto-API output.

---

## 1. The 60-Second Quickstart

| Second | What you do                                                                              |
| ------ | ---------------------------------------------------------------------------------------- |
| 0–10   | Sign in (Google / email magic link). Free tier — no card.                                |
| 10–25  | Type in plain English: *"When a GitHub PR opens, summarize it with Claude, email me."*   |
| 25–40  | Zigsaw renders a 4-node workflow. Confirm. The chat asks for any missing API keys.       |
| 40–55  | Click **Run**. Live execution streams: trigger fired → Claude responded → Gmail sent.    |
| 55–60  | Click **Deploy**. Get a public webhook URL. Your automation is live.                     |

That is the entire promise. Everything below is what makes the next run faster, cheaper, smarter, or more powerful than the last.

---

## 2. Track A — Chat-to-Workflow

### When to use
You know **what outcome you want** but not which integrations / nodes to wire up.

### How it works
1. The user types a free-form prompt in `NaturalLanguageWorkflowCreator.tsx`.
2. `workflowGenerationService.ts` builds a structured Anthropic-bound prompt:
   - Constraints: only the registered node types may appear.
   - Schema: nodes + edges JSON, IDs of form `<type>-<n>`, x-positions in 300px increments.
   - Hard rules: every workflow starts with a `trigger` node, no orphan nodes, no cycles.
3. The Claude response is parsed, validated by Zod, and a fallback chain kicks in if the model fails:
   ```
   Anthropic Claude → OpenAI GPT-4 → Groq Llama → Curated template → Demo workflow
   ```
4. The validated workflow is added to the canvas via `addNodes` + `addEdges` in `WorkflowContext`. The user sees a mini-canvas preview inline before the full canvas updates.
5. Clarifying questions are posed when the prompt is under-specified ("Which inbox?", "How often?").

### Prompt patterns that work
- **Outcome-first**: *"Send me a Slack DM whenever a Stripe charge over $1,000 succeeds."*
- **Trigger + transform + action**: *"Watch the #leads channel, classify intent with Claude, write to HubSpot."*
- **Schedule + report**: *"Every Monday 9am, summarize last week's PRs and email the team."*

### What ships back
A workflow with: a trigger, the minimum AI/transform nodes, the integration sinks, and pre-filled configuration where the prompt was specific enough.

> Ship target: < 2 seconds from prompt submit to canvas-rendered workflow on a 95th-percentile network.

---

## 3. Track B — Visual Editor

### When to use
You want **explicit control** over branching, parallelism, retries, or have a workflow that doesn't fit a single sentence.

### Canvas mechanics
- ReactFlow-based. Drag from the left **Node Panel** onto the canvas.
- Every node is a **Universal Node** — same chrome, same selection model, same keyboard handling — wrapped around a node-specific configuration form.
- Edges are typed: control flow, data flow, error path. Different colors, same connection model.
- Mini-map for large flows. Auto-layout (`Cmd+Shift+L`) for clean diagrams.
- Multi-select + bulk edit via `dnd-kit` outside the canvas.

### 25+ Node Types

| Category         | Nodes                                                                                                      |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| **Triggers**     | Manual, Webhook, Schedule (cron), Email, GitHub Event, Calendar Event                                      |
| **AI Models**    | Claude 4 (Universal Agent), GPT-4, Gemini, Groq Llama, Whisper (STT), BLIP-2 (vision), Imagen, Veo3        |
| **Integrations** | GitHub, Gmail, Google Calendar, Firecrawl (web extract), Custom API connector, Database                    |
| **Data**         | Document parser, Embeddings, Search, GraphRAG, Network trace                                               |
| **Logic**        | Router (conditional), Loop, Human-in-the-Loop, Login (auth gate), Title (annotation)                       |
| **Outputs**      | Email, Slack (planned), Webhook, Database write, Calendar create                                           |
| **Pipelines**    | Claude GitHub Pipeline (PR review + issue triage end-to-end)                                               |

### Configuration UX
Each node opens a side-sheet with the configuration form. Forms are Zod-validated. Required-but-empty fields are highlighted before run. Sensitive fields (API keys) are masked and stored encrypted via the secure key service.

### Save / version
Auto-save fires every 2 seconds via `workflowPersistenceService.ts`. A workflow's version history lives in Firestore — rollback is one click.

---

## 4. Track C — Creative Engine (Ads)

### What it is
The AI ad creative pipeline inherited from `zigsaw-labs` — automated short-form video creation, A/B testing, and multi-platform publishing for performance marketing.

### Why a separate track
The economics and the loop are different: creative generation is an **explore-exploit problem** measured in CTR, retention, and CAC. The platform handles it as a specialized workflow track with built-in metrics.

### Pipeline
```
Product images + brief
        │
        ▼
[ AI Prompt Optimizer ]   ← turn brief into 100 variant prompts
        │
        ▼
[ Visual Analyzer ]       ← brand + competitor scoring on inputs
        │
        ▼
[ Veo 3 Generator ]       ← N video variations per prompt
        │
        ▼
[ Approval Gate ]         ← optional human review (configurable)
        │
        ▼
[ Multi-Platform Publish ]   → TikTok, IG Reels, YouTube Shorts, Meta, LinkedIn
        │
        ▼
[ Performance Tracker ]   ← CTR, retention, conversion per variant
        │
        ▼
[ Reinforcement Loop ]    ← winners feed next generation cohort
```

### Result targets (from `zigsaw-labs` benchmarks)
| Metric              | Baseline   | Month 1  | Month 3   |
| ------------------- | ---------- | -------- | --------- |
| CTR                 | 3–5%       | 8–10%    | 12–15%    |
| Retention           | 50–60%     | 70–75%   | 80–85%    |
| Cost / video        | $5,000     | $200     | $50       |
| Videos / month      | 5–10       | 50–100   | 200+      |

### Where it lives in the unified repo
- Frontend nodes: `Veo3Node`, `Blip2Node`, `ImagenNode` already exist.
- Backend services for campaign + generation + publishing + metrics will mount under `services/{campaign,generation,metrics,publishing}/` mirroring the `zigsaw-labs` Turbo monorepo layout.

---

## 5. Track D — GitHub Co-pilot

### What it is
The Mastra + MCP-based GitHub Automation Agent inherited from `zigsaw-backend`. Drives repo workflow with natural language: review PRs, triage issues, audit commits, surface security concerns.

### Built-in capabilities
- **Repository analysis** — health, stats, recent activity.
- **PR management** — diff summary, code-quality assessment, blocking issue detection.
- **Issue creation** — well-structured issues with labels and reproduction context.
- **Commit analysis** — pattern detection across the recent history.
- **Security scan** — surface OWASP Top 10 patterns.
- **Code-quality review** — best practices, complexity hotspots.

### Natural-language trigger phrases
- *"Check recent changes to head of main and open an issue if you find a security flaw."*
- *"Analyze PR #42 in `microsoft/vscode` and propose three high-priority improvements."*
- *"Get repository overview for `lonexreb/zigsaw` and summarize the last 14 days."*

### How it surfaces inside Zigsaw
As a **single composite node**: `ClaudeGitHubPipelineNode`. Drop it into any workflow, configure repo + actions, and downstream nodes consume its structured output.

Underneath it talks to the GitHub MCP server (`github_mcp_server.py` in the inherited Python backend) and uses Claude as the reasoning engine.

---

## 6. The Execution Lifecycle

Every workflow — regardless of how it was authored — runs through the same engine.

```
1. VALIDATE
   - Zod-check node configs.
   - Topological sort; reject cycles or orphans.
   - Resolve credentials (frontend > backend > env vars).

2. PLAN
   - Build the execution DAG.
   - Mark independent branches as parallelizable.
   - Materialize the run record in Firestore (status: queued).

3. RUN
   - For each ready node: spawn an async executor.
   - Stream logs and partial outputs to the client over SSE.
   - Capture timing, tokens, cost per node.
   - Retries on transient failures with exponential backoff (default 3, max 60s).

4. RECOVER
   - On hard failure: pause downstream, mark node failed, surface diagnostic.
   - User can edit + resume from the failed node without re-running successful upstream.

5. COMPLETE
   - Aggregate outputs into the final result envelope.
   - Persist run record (status: completed, metrics, cost).
   - Trigger any post-run hooks (notifications, webhooks).
```

### Streaming UX
The canvas highlights each node as it runs (queued → running → success/error). The right-side **MetricsPanel** streams tokens, latency, and cost per node in real time.

### Determinism + replay
Every run is replayable from its captured input + node configurations + RNG seeds. Useful for debugging non-deterministic AI nodes — you can lock the model temperature and rerun with the same seed.

---

## 7. Deploy Any Workflow as a Live API

Once a workflow runs cleanly, the **Deploy** button in the canvas header (`DeploymentModal.tsx`) does this in one shot:

1. Snapshot the workflow + configuration.
2. Generate a stable endpoint: `https://api.figsaw.dev/w/<slug>`.
3. Auto-publish an OpenAPI spec at `https://api.figsaw.dev/w/<slug>/openapi.json`.
4. Issue a per-endpoint API key bound to the user's account.
5. Add the deployment to `multiWorkflowDeploymentService.ts` so it appears in the user's deployment dashboard.

### Calling a deployed workflow
```bash
curl -X POST https://api.figsaw.dev/w/pr-summarizer \
  -H "Authorization: Bearer $ZIGSAW_KEY" \
  -H "Content-Type: application/json" \
  -d '{"input": {"repo": "lonexreb/zigsaw", "pr": 42}}'
```

Response shape:
```json
{
  "success": true,
  "runId": "wfr_01HVYB8Q…",
  "data": { "summary": "…", "risk": "low" },
  "meta": { "durationMs": 1820, "tokens": 4321, "costUsd": 0.0123 }
}
```

### Live updates
Editing the workflow + clicking **Re-deploy** swaps the running version atomically — in-flight requests finish on the old version; new requests hit the new version.

---

## 8. Monitoring, Metrics & Cost Control

### What you see
- **MetricsPanel** — per-run latency, tokens in/out, $ cost, error rate.
- **Network monitoring** — every outbound HTTP call captured (`network_monitoring_service`), replayable.
- **Usage metrics** — daily/weekly/monthly aggregates per workflow + per provider.
- **Knowledge graph** — 3D force graph visualizing nodes + executions for large workflows.

### Cost guardrails
- Per-workflow budgets (USD/day). Workflow auto-pauses when crossed.
- Per-user monthly cap (free tier = 100 runs).
- Provider routing: low-stakes nodes → Haiku/Groq; high-stakes nodes → Opus/GPT-4. Configurable per node.
- Caching: identical inputs to deterministic nodes return cached results (TTL configurable).

### Alerts
- Email + webhook on: run failed, budget hit, latency p95 over threshold.
- Slack channel integration (planned).

---

## 9. Integrations Catalog

Current registered services live under `frontend/src/services/`. Each one has a paired backend route.

| Service                   | Capability                                                          |
| ------------------------- | ------------------------------------------------------------------- |
| `aiNodesService`          | Generic AI node dispatch                                            |
| `apiService`              | Custom REST connector                                               |
| `blip2Service`            | BLIP-2 image captioning + VQA                                       |
| `calendarService`         | Google Calendar read/write                                          |
| `claudeCodeService`       | Claude-driven code edits                                            |
| `claudeGithubService`     | Claude + GitHub composite                                           |
| `deploymentService`       | Deploy / redeploy workflows                                         |
| `documentService`         | PDF / DOCX / TXT parsing                                            |
| `fetchaiService`          | Fetch.ai agent connector                                            |
| `firecrawlService`        | Web extract + crawl                                                 |
| `githubService`           | GitHub repo / PR / issue                                            |
| `gmailService`            | Gmail send + read                                                   |
| `groqBrickAnalysisService`| Groq-hosted Llama for fast analysis                                 |
| `imagenService`           | Imagen image generation                                             |
| `integratedWorkflowService`| Cross-workflow composition                                         |
| `multiWorkflowDeploymentService` | Manage many deployed workflows                               |
| `networkService`          | Network observability                                               |
| `searchService`           | Web/data search                                                     |
| `toolMarketplaceService`  | Discover community-published nodes                                  |
| `veo3Service`             | Veo 3 video generation                                              |
| `whisperService`          | Whisper STT                                                         |
| `workflowExecutionService`| Run orchestration                                                   |
| `workflowGenerationService`| Chat-to-workflow synthesis                                         |
| `workflowPersistenceService`| Save / restore / version                                          |

Adding an integration = follow the **node authoring checklist** in `CLAUDE.md` §6.

---

## 10. The Compounding Optimization Loop

This is what makes Zigsaw different from a static workflow tool. Every run feeds three feedback channels:

1. **Per-workflow learning**
   Cached outputs, prompt-template auto-tuning, latency-aware provider routing.

2. **Per-user learning**
   Frequently-used node patterns surface as **starred templates**. Common typo corrections in chat prompts feed a personal autocomplete model.

3. **Per-fleet learning**
   Aggregate (anonymized) workflow shapes feed the chat-to-workflow generator's few-shot exemplars. The next user describing a similar problem gets a better starting workflow.

For Track C (Creative Engine), the optimization loop is explicit: winners reinforce next-gen prompts, losers prune the search space, the campaign converges on the highest-CTR variants in 2–3 weeks.

---

## 11. Pricing, Credits & Trial

### Free tier
- 100 workflow executions / month.
- Claude Haiku + GPT-3.5 + Groq Llama.
- Community support.
- Standard integrations.

### 7-day full-access trial
- Every paid feature unlocked.
- 1,000 credits prepaid (≈ 1,000 standard runs).
- No card required to start. Card prompt only on day 6 if user wants to continue.

### Pro — $29 / month
- 10,000 executions / month.
- Claude Sonnet + GPT-4 + Gemini Pro.
- Priority support, advanced analytics, team of 5.

### Enterprise — custom
- Unlimited executions.
- Claude Opus + GPT-4 Turbo.
- SSO (SAML / OIDC), audit logs, on-prem option, dedicated support manager.

### Credit accounting
- AI calls are metered by **input + output tokens × provider price**.
- Non-AI integration calls are metered as **1 credit per call** (configurable).
- Live cost preview in the canvas before running.
- Stripe-backed billing (`@stripe/react-stripe-js` already integrated).

---

## 12. Enterprise Path

| Concern                  | Default                                             | Enterprise option                     |
| ------------------------ | --------------------------------------------------- | ------------------------------------- |
| Auth                     | Firebase email/password + Google                    | SAML, OIDC, SCIM provisioning         |
| Data residency           | US (default)                                        | EU, APAC, customer-controlled bucket  |
| Encryption               | TLS 1.3 in transit, AES-256 at rest                 | Customer-managed KMS keys             |
| Audit                    | 30-day rolling                                      | Immutable, exportable, 7-year         |
| Compliance               | SOC 2 ready (in progress)                           | HIPAA / PCI add-on                    |
| Deployment               | Managed SaaS                                        | Single-tenant cloud, on-prem, air-gap |
| SLA                      | 99.5%                                               | 99.9% with credits                    |

---

## 13. Reference Architecture (Unified)

```
                         ┌──────────────────────────────┐
                         │  Browser / Mobile (PWA)      │
                         │  React 18 + ReactFlow + TS   │
                         │  shadcn/ui + Tailwind        │
                         └──────────────┬───────────────┘
                                        │ HTTPS / SSE
                                        ▼
                         ┌──────────────────────────────┐
                         │  Edge — Next.js API routes   │
                         │  (api-backend/)              │
                         │  Auth, validation, AI proxy  │
                         └──────┬─────────────────┬─────┘
                                │                 │
                ┌───────────────┘                 └────────────────┐
                ▼                                                  ▼
   ┌────────────────────────┐                       ┌──────────────────────────┐
   │ Workflow Executor      │                       │  Specialized Services    │
   │ (TypeScript / Python)  │                       │  (from zigsaw-backend +  │
   │ Topological scheduler  │                       │   zigsaw-labs)           │
   │ Streaming runtime      │                       │                          │
   │ Retry + recovery       │                       │  - github MCP server     │
   └──────┬─────────────────┘                       │  - calendar MCP server   │
          │                                         │  - generation pipeline   │
          │                                         │  - publishing pipeline   │
          ▼                                         │  - metrics aggregator    │
   ┌────────────────────────┐                       └──────────────────────────┘
   │ Provider Layer         │
   │ Claude / GPT / Gemini  │
   │ Groq / Veo3 / Imagen   │
   │ Firecrawl / GitHub     │
   │ Gmail / Calendar       │
   └────────────────────────┘
                                        │
                                        ▼
                         ┌──────────────────────────────┐
                         │  Persistence                 │
                         │  Firebase Auth + Firestore   │
                         │  Encrypted secrets vault     │
                         │  Run-history append log      │
                         └──────────────────────────────┘
```

### Why this shape
- **Edge for fan-out**, executor for long-running work. No 10s Vercel timeout traps.
- **Provider layer is replaceable**. New AI vendor? One service module + one node = done.
- **MCP servers for external systems** so the same agent reasoning works across providers.
- **Append-only run log** is the source of truth for replay, billing, and analytics.

---

## 14. Best Practices & Anti-Patterns

### Do
- ✅ Start every workflow with a **trigger** node — even manual triggers.
- ✅ Validate inputs at the trigger; fail fast with clear messages.
- ✅ Branch with the **Router** node — never with multiple parallel triggers.
- ✅ Add a **Human-in-the-Loop** gate before destructive actions (delete, send-to-customer, charge).
- ✅ Pin AI model versions in production deployments.
- ✅ Set per-workflow budgets before deploying publicly.
- ✅ Use the cheapest model that meets quality; route up only when confidence is low.
- ✅ Cache deterministic transforms.
- ✅ Write a **golden-path E2E test** for any deployed workflow.

### Don't
- ❌ Embed secrets in node descriptions or workflow names.
- ❌ Loop without an exit condition or max-iteration cap.
- ❌ Fan out 100+ parallel AI calls without rate-limit awareness — providers will 429 you.
- ❌ Catch and ignore errors silently — every node failure must surface to the user.
- ❌ Skip the **Approval Gate** for external sends in the Creative Engine track.
- ❌ Hand-edit deployed workflow JSON outside the editor — version control will fight you.

---

## 15. Appendix — Where Each Track Came From

| Track                    | Originating repo(s)                               | What was lifted                                              |
| ------------------------ | ------------------------------------------------- | ------------------------------------------------------------ |
| Chat-to-Workflow         | `zigsaw` (current)                                | `NaturalLanguageWorkflowCreator`, `workflowGenerationService`|
| Visual Editor            | `zigsaw` (current) + `zigsaw-yc`                  | ReactFlow canvas, node library, persistence                  |
| Creative Engine          | `zigsaw-labs` + `Zigsaw-lab`                      | Veo 3 + multi-platform publishing + perf benchmarks          |
| GitHub Co-pilot          | `zigsaw-backend`                                  | Mastra + MCP, Claude GitHub agent, repo automation tools     |
| Marketing surfaces       | `Zigsaw-lab`                                      | Onboarding, Pricing, Product, Support, UseCases, Waitlist    |
| Backend reference (Py)   | `zigsaw-backend`                                  | Layered FastAPI (`routes`/`services`/`repositories`/`models`)|
| Microservice topology    | `zigsaw-labs`                                     | Turbo monorepo: campaign / generation / metrics / publishing |
| YC application context   | `zigsaw-yc`                                       | Lean ReactFlow + FastAPI starter as integration test target  |
| Desktop wrapper          | `zigsaw-mac`                                      | Reserved — empty repo. Defer until product-market fit.       |

---

## Closing

This document is the **single source of truth for how Zigsaw operates end-to-end**. Update it the moment a track changes shape. If you (human or agent) catch yourself deviating from the loop in §0, stop and re-read. The loop is the product.

> **Connect the pieces. Chat your automation. Run the loop. Compound the wins.**
