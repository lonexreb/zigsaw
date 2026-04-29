# Zigsaw Python sidecar (`backend-py/`)

Long-running execution engine for Zigsaw workflows. Lives alongside the
Next.js `api-backend/` so the edge layer can hand off work that exceeds the
serverless 10s timeout.

## What's ported here

Issues this folder closes (foundation):

- **#2** — Python FastAPI execution-engine sidecar from `zigsaw-backend`.
- **#3** — Mastra GitHub MCP server + Claude GitHub agent from `zigsaw-backend`.

Lifted directly from `lonexreb/zigsaw-backend`:

| Source path                                  | Destination                                    |
| -------------------------------------------- | ---------------------------------------------- |
| `app/services/github_mcp_server.py`          | `app/services/github_mcp_server.py`            |
| `app/services/github_service.py`             | `app/services/github_service.py`               |
| `claude_github_mcp_cli.py`                   | `app/services/claude_github_mcp_cli.py`        |
| `app/models/github_models.py`                | `app/models/github_models.py`                  |
| `app/config.py`                              | `app/core/config.py`                           |

Pending follow-up (each is its own slice — a single PR per service):

- workflow execution service (topological sort + parallel branches)
- AI service (Claude / OpenAI / Gemini / Groq router)
- Gmail / Calendar / Firecrawl / Veo3 / Imagen / Whisper / BLIP-2 services
- repositories layer (Firestore-backed)
- middleware (auth, rate-limit, error)
- routes — one per resource

The github models file is intentionally minimal because the MCP server file
references richer types (`GitHubCredentials`, `GitHubOperation`, `GitHubAuthType`,
…). When porting the workflow execution service, port the richer model types
alongside.

## Running locally

```bash
cd backend-py
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

Then `curl http://localhost:8000/health`.

## Layout

```
backend-py/
├── app/
│   ├── main.py            FastAPI app
│   ├── core/              config + logging
│   ├── infrastructure/    firebase, redis, queue clients
│   ├── middleware/        auth, rate-limit, error
│   ├── models/            pydantic schemas
│   ├── repositories/      data access (Firestore)
│   ├── routes/            HTTP endpoints (one per resource)
│   └── services/          business logic
└── requirements.txt
```

## Wiring to the Next.js edge

Until the proxy lands, the Next.js `api-backend/` calls this service over
HTTP. Set `BACKEND_PY_URL` in the Next.js env. Production deploys both as
separate services behind the same Vercel rewrites or a single Cloud Run
gateway.

## Why a separate process

- 10-second edge timeout on Vercel kills any non-trivial workflow.
- Streaming SSE works better from a long-lived process.
- Background queue workers need a place to live.
- Pydantic + asyncio are an excellent fit for the executor pattern.
