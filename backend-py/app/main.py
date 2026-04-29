"""
Zigsaw Python sidecar — FastAPI execution engine (issue #2).

This process is intentionally separate from the Next.js `api-backend/`
because long-running workflow execution needs more than the 10s edge
timeout. It runs alongside the Next.js app behind the same reverse proxy.

Layout follows the layered architecture from `architecture/LAYERED_ARCHITECTURE.md`:
- routes/        — HTTP endpoints
- services/      — business logic
- repositories/  — data access
- models/        — pydantic schemas
- middleware/    — auth, rate limit, error
- core/          — config, logging
- infrastructure/— firebase admin, redis, queue
"""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(
    title="Zigsaw Backend",
    version="0.1.0",
    description="Python sidecar for long-running workflow execution.",
)

# CORS — tighten allowlist in production via env vars.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok", "service": "zigsaw-backend-py"}


# Routes will be mounted as services land. Each service module owns its
# router and is included here:
#
# from .routes import workflow_execution, github_mcp, gmail, calendar
# app.include_router(workflow_execution.router, prefix="/v1/workflow", tags=["workflow"])
# app.include_router(github_mcp.router, prefix="/v1/github-mcp", tags=["github"])
