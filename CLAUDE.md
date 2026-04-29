# CLAUDE.md — Zigsaw Development Manual

> Operating manual for Claude Code (and any AI agent) working in the **Zigsaw** unified workspace.
> Read this file end-to-end before touching any code in this repo.

---

## 0. Mission Statement

Zigsaw is **one platform that turns plain English into shipped automation**. It unifies what previously lived across multiple repos (`zigsaw`, `zigsaw-labs`, `zigsaw-yc`, `zigsaw-mac`, `zigsaw-frontend`, `zigsaw-backend`, `Zigsaw-lab`) into a single product surface:

| Layer                | What it does                                                                                  |
| -------------------- | --------------------------------------------------------------------------------------------- |
| **Chat-to-Workflow** | Natural-language description → executable graph. No code required.                            |
| **Visual Editor**    | ReactFlow canvas with 25+ node types (AI, integrations, data, logic).                         |
| **Execution Engine** | Topologically-sorted, parallel, observable runtime with retries and streaming.                |
| **Auto-API**         | Any workflow becomes a deployed REST endpoint with one click.                                 |
| **Creative Engine**  | (from `zigsaw-labs`) AI ad pipeline — short-form video creation, A/B testing, multi-platform. |
| **GitHub Co-pilot**  | (from `zigsaw-backend`) Mastra/MCP-powered repo automation: PRs, issue triage, code review.   |
| **Marketing Site**   | (from `Zigsaw-lab`) onboarding, pricing, waitlist, support, product surfaces.                 |

The current repo's UI is the **canonical surface**. Everything else gets folded into it without breaking visual continuity.

---

## 1. Repository Layout

```
zigsaw/
├── frontend/                # Vite + React 18 + TS + ReactFlow + shadcn/ui (PRIMARY UI)
│   ├── src/
│   │   ├── components/      # 25+ workflow nodes, UI primitives, panels
│   │   │   ├── nodes/       # Workflow node implementations (Claude, Gmail, GitHub, Veo3, …)
│   │   │   ├── ui/          # shadcn primitives (button, card, dialog, …)
│   │   │   └── workflow/    # Canvas + header
│   │   ├── pages/           # Index (canvas), Login, Subscription, Success, Cancel, NotFound
│   │   ├── services/        # 20+ provider integrations (AI, Gmail, GitHub, Calendar, Firecrawl, …)
│   │   ├── contexts/        # AuthContext, NetworkAnalyticsContext, NodeNamingContext
│   │   ├── hooks/           # Custom React hooks
│   │   └── lib/             # Shared utilities
│   └── tests/               # Phase 1/2/3 test suites
│
├── api-backend/             # Next.js API routes (current backend surface)
│   └── pages/api/
│       ├── v1/              # chat, chat-with-tools, firecrawl, nodes, workflows
│       └── workflow/        # execute
│
├── architecture/            # Internal team docs
│   ├── PROJECT_OVERVIEW.md
│   ├── NORTHSTAR_ARCHITECTURE.md
│   ├── LAYERED_ARCHITECTURE.md
│   ├── ARCHITECTURE_DIAGRAMS.md
│   └── REFACTORED_FOLDER_STRUCTURE.md
│
├── gitbook/                 # Public docs published at docs.figsaw.dev
│
├── CLAUDE.md                # ← You are here
├── ONE-STOP-WORKFLOW.md     # End-to-end product workflow + research
├── README.md                # Public-facing project entry point
└── package.json             # Root workspace metadata
```

### Where unified pieces live

| Origin repo       | Unified location                                                              |
| ----------------- | ----------------------------------------------------------------------------- |
| `zigsaw`          | Root — current UI is preserved verbatim.                                      |
| `zigsaw-labs`     | `services/generation/`, `services/campaign/`, `services/metrics/` (planned).  |
| `zigsaw-backend`  | `api-backend/` extended with Python FastAPI sidecar at `backend-py/` (planned).|
| `zigsaw-frontend` | Folded into `frontend/` — no duplicate.                                       |
| `Zigsaw-lab`      | Marketing pages added under `frontend/src/pages/marketing/` (planned).        |
| `zigsaw-yc`       | Reference only — clean ReactFlow + FastAPI starter.                           |
| `zigsaw-mac`      | Empty — defer until desktop wrapper is needed.                                |

---

## 2. Tech Stack (authoritative)

### Frontend
- **React 18** + **TypeScript** (strict mode)
- **Vite 5** for dev/build
- **ReactFlow (`@xyflow/react`)** for the workflow canvas
- **shadcn/ui** (Radix primitives) + **Tailwind CSS 3**
- **Framer Motion** for animation
- **TanStack Query** for server state
- **react-router-dom v7** for routing
- **dnd-kit** for sortable/drag interactions outside the canvas
- **3d-force-graph + three.js** for the Knowledge Graph view
- **Firebase** (Auth + Firestore)
- **Stripe** (`@stripe/react-stripe-js`) for subscriptions
- **Zod** for schema validation
- **Sonner / Radix Toast** for notifications

### Backend
- **Next.js API routes** at `api-backend/` (TypeScript)
- AI providers: **Anthropic Claude**, **OpenAI**, **Google Gemini**, **Groq**
- Integrations: GitHub, Gmail, Google Calendar, Firecrawl, Veo3, Whisper, BLIP-2, Imagen
- Persistence: **Firebase Firestore**
- Auth: **Firebase JWT**

### Tooling
- **bun** (lockfile present) — frontend installs/dev
- **npm / pnpm** — root + api-backend
- **ESLint** + **Prettier** + **TypeScript** strict
- **Jest** + custom phase test runners

---

## 3. Development Principles (non-negotiable)

1. **No-code, always.** Zigsaw is a no-code product. There is no public Python SDK. All capabilities surface through the UI or auto-generated APIs.
2. **UI continuity.** The current frontend visual language is canonical. Do not redesign components, recolor, or refactor working UI. New surfaces inherit the existing tokens.
3. **Mobile-first + WCAG 2.1 AA.** Every new component must pass touch-target (≥44px), keyboard, and screen-reader checks. See `architecture/CLAUDE.md` for prior baselines.
4. **Incremental commits.** Code small, verify, commit. Auto mode commits and pushes after every meaningful artifact lands. Never bundle unrelated changes.
5. **Type safety > convenience.** No `any`. Use `unknown` for external/untrusted data, narrow with Zod at boundaries.
6. **Immutability.** Spread/return new objects. Never mutate React state, props, or workflow node data in place.
7. **Files small, focused.** Aim 200–400 lines, hard cap 800. Split by feature, not by type.
8. **Secrets are environment variables.** Never hardcode API keys. Never commit `.env`. If you find a leaked secret in the repo, rotate it immediately and add it to `.gitignore` checks.
9. **Update CLAUDE.md.** Whenever architecture, conventions, or critical decisions change, update this file in the same commit. Future agents read this first.
10. **AI Pragmatic Programmer (5-step) for AI features.** Plan → Prompt → Generate & Review → Refine → Ship.

---

## 4. Daily Commands

### Frontend
```bash
cd frontend
bun install                  # or: npm install
bun run dev                  # http://localhost:8081
bun run build                # production build to frontend/dist
bun run lint                 # ESLint with --max-warnings 0
bun run test:all             # phase 1 + 2 + 3 tests
bun run test:ai-creator      # phase 1 — critical fixes
bun run test:phase2          # UX improvements
bun run test:phase3          # accessibility + mobile
```

### API backend
```bash
cd api-backend
npm install
npm run dev                  # Next.js dev server
npm run build && npm start
```

### Whole repo
```bash
# From root, after dependencies installed:
git status                   # always check before/after work
git log --oneline -10        # recent context
```

---

## 5. Coding Conventions

### TypeScript
- Public APIs (exported functions, hooks, components) carry explicit types.
- Use `interface` for object shapes that may be extended; `type` for unions/intersections/utilities.
- Prefer string-literal unions over `enum` unless interop demands `enum`.
- React components: prop type as named `interface`; do not use `React.FC`.
- Validate external input with **Zod** schemas; infer types via `z.infer<typeof schema>`.

### React
- One component per file unless siblings are tightly coupled and < 50 lines each.
- State: server state → TanStack Query; client state → Context + `useState`/`useReducer`; URL state → `useSearchParams`.
- Co-locate component-specific styles, hooks, and tests with the component.
- Memoize expensive children with `React.memo`; memoize callbacks/derived values with `useCallback`/`useMemo` only when a profiler proves it matters.

### Styling
- Tailwind utility classes preferred. Reach for CSS variables in `tokens.css` for tokens (color, spacing, radius, motion).
- Animate compositor-friendly properties only (`transform`, `opacity`, `clip-path`). Never animate layout properties.
- Touch targets ≥44px on mobile breakpoints.

### Accessibility
- Every interactive element has an accessible name (visible text or `aria-label`).
- Live regions (`role="log"`, `aria-live="polite"`) for streaming AI output.
- Focus order is logical; visible focus rings preserved.
- Keyboard shortcuts: `Cmd/Ctrl+Enter` to submit, `Escape` to close overlays.

---

## 6. Workflow Node Authoring Checklist

When adding a new node under `frontend/src/components/nodes/`:

1. Create `<NodeName>Node.tsx` extending `universal-node-wrapper`.
2. Register the node type in the `nodeTypes` map (canvas registration).
3. Add a service file under `frontend/src/services/<feature>Service.ts` with **typed** request/response shapes (Zod-validated).
4. Add a backend route under `api-backend/pages/api/v1/<feature>.ts` if external API calls are required (never call third-party APIs directly from the browser with secret keys).
5. Document the node in `gitbook/features/` with: purpose, inputs, outputs, configuration, example workflow.
6. Add a test in `frontend/tests/` covering happy path + one error path.
7. Verify keyboard + screen-reader traversal of the node configuration panel.

---

## 7. Backend Conventions

### Next.js API routes (`api-backend/`)
- One file per resource. `/v1/<resource>.ts` for CRUD, `/workflow/<verb>.ts` for actions.
- Always validate request bodies with Zod before processing.
- Return shape:
  ```ts
  type ApiResponse<T> = {
    success: boolean
    data?: T
    error?: string
    meta?: { total: number; page: number; limit: number }
  }
  ```
- Wrap external calls (Anthropic, OpenAI, Firecrawl) in service modules; never inline.
- Stream long-running responses via Server-Sent Events when the client needs progressive output.

### Future Python FastAPI sidecar (`backend-py/`)
When the heavy execution engine from `zigsaw-backend` lands here:
- Mirror the layered structure: `app/{routes,services,repositories,models,middleware,core,infrastructure}`.
- Pydantic for validation; AsyncIO for I/O concurrency.
- One service per integration (`ai_service`, `github_service`, `gmail_service`, etc.).
- Mastra-style MCP servers stay under `app/services/<x>_mcp_server.py`.

---

## 8. Security Rules

- **Never** commit secrets. The repo previously contained a hardcoded Anthropic API key in `architecture/CLAUDE.md` — if you encounter such a key anywhere, **stop, redact, rotate, and notify the maintainer**.
- API keys flow: frontend localStorage → request header → backend service → environment-variable fallback. Backend is the source of truth.
- Encrypt API keys at rest. The `secure_api_keys_service` (from `zigsaw-backend`) is the reference implementation.
- All endpoints rate-limit by user. Defaults: 60 req/min for chat, 10 req/min for workflow execution.
- CORS allowlist explicit origins. No `*` in production.
- TLS 1.3 in transit, AES-256 at rest.
- Stripe + Firebase secrets in `.env.local` only — never in `.env` checked-in files.

Use the `security-reviewer` agent before merging any auth, payment, or user-input handling change.

---

## 9. Testing Standards

- **Coverage target: 80% lines + branches** for critical paths (workflow generation, execution, auth, billing).
- Unit tests for pure utilities and hooks (Jest + React Testing Library).
- Integration tests for API routes (Jest + Supertest pattern).
- E2E tests for golden flows (Playwright):
  - Chat-to-workflow: type prompt → workflow appears on canvas → execute → see result.
  - Visual editor: drag node → connect → configure → execute.
  - Subscription: signup → Stripe checkout → success page → entitlement granted.
- Accessibility automated checks (`@axe-core/react`) run in CI on PR.
- Visual regression (Playwright screenshots) for hero, canvas, and key panels at 320 / 768 / 1024 / 1440 px.

Run `bun run test:all` before opening a PR.

---

## 10. Git Workflow

### Commit format
```
<type>: <imperative summary under 70 chars>

<optional body explaining WHY>
```
Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

### Branching
- `main` is the single integration branch.
- Feature branches off `main`, rebased before merge.
- Auto mode in this repo is allowed to commit and push directly to `main` for small, reversible doc/config changes only. Code changes go through PR.

### Pull requests
1. Verify CI green (lint + types + tests).
2. Resolve conflicts.
3. Use the `code-reviewer` agent before requesting human review.
4. Title: `<type>: <summary>`. Body: summary + test plan checklist.

### Pre-commit
- `bun run lint`
- `bun run build` (catches type errors)
- `bun run test:all` for code touching `frontend/src` or `api-backend/pages/api`.

---

## 11. Agent Delegation Map

| Situation                         | Agent                  |
| --------------------------------- | ---------------------- |
| New feature / refactor planning   | `planner` / `architect`|
| Build/type errors                 | `build-error-resolver` |
| TypeScript review                 | `typescript-reviewer`  |
| Security-sensitive change         | `security-reviewer`    |
| Code review on a slice            | `code-reviewer`        |
| TDD enforcement                   | `tdd-guide`            |
| E2E coverage                      | `e2e-runner`           |
| Dead-code cleanup                 | `refactor-cleaner`     |
| Docs / codemap update             | `doc-updater`          |
| Database / SQL                    | `database-reviewer`    |
| Performance bottlenecks           | `performance-optimizer`|

Run independent agents in **parallel** with multiple `Agent` tool calls in one message.

---

## 12. Roadmap (current truth)

### Done ✅
- Phase 1 — chat-to-workflow state synchronization, real Anthropic key plumbing.
- Phase 2 — single-tab UX, inline workflow preview, auto-save drafts, error recovery.
- Phase 3 — mobile responsive, WCAG 2.1 AA, multi-provider fallback strategy.
- Stripe subscription flow + Firebase auth.
- 25+ workflow node types.
- Firecrawl integration with debug guide.

### In progress 🚧
- Unified repo merge of `zigsaw-labs` + `zigsaw-backend` capabilities.
- Encrypted API key vault.
- Per-user rate limiting + usage metrics.

### Next 🎯
- 7-day trial system + credit metering.
- Workflow marketplace (templates).
- GitHub Mastra co-pilot surfaced as a node ("AI Repo Assistant").
- AI ad creative engine (Veo 3 + multi-platform publishing) as a workflow track.
- Enterprise SSO (SAML / OIDC).

---

## 13. Authoritative References Inside This Repo

- `ONE-STOP-WORKFLOW.md` — the end-to-end user/operator workflow, with research citations.
- `README.md` — public-facing pitch + quickstart.
- `architecture/NORTHSTAR_ARCHITECTURE.md` — long-horizon architecture.
- `architecture/LAYERED_ARCHITECTURE.md` — current layered breakdown.
- `architecture/REFACTORED_FOLDER_STRUCTURE.md` — target folder structure.
- `architecture/CLAUDE.md` — historical Claude manual (kept for context; this root file supersedes it).
- `gitbook/` — user-facing documentation source.

---

## 14. When You Are Unsure

1. Read this file again.
2. Read `ONE-STOP-WORKFLOW.md` for the operating loop.
3. Search the codebase with `Grep` / `Explore` agent before asking the user.
4. Prefer the smallest reversible change. Commit it. Iterate.
5. If a change spans more than 3 files or touches auth/payments, hand off to `planner` or `architect` first.

> **Build the unified Zigsaw. Keep the UI the user already loves. Land it in small, observable steps.**
