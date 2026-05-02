"""FastAPI application entrypoint for the Portfolio AI backend.

Run with:
    conda activate goldman-digger-ai
    cd ai-backend
    uvicorn portfolio_ai.main:app --port 8001 --reload
"""
from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from portfolio_ai.api import api_router
from portfolio_ai.config import settings

logging.basicConfig(level=settings.LOG_LEVEL.upper(), format="%(asctime)s %(levelname)s %(name)s — %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Portfolio GPS — AI Backend",
    description="FastAPI / LangChain senior-consultant agent with 18 research tools.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8080", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.get("/health")
async def health():
    return {"status": "ok", "service": "portfolio-ai", "model": settings.ANTHROPIC_MODEL}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("portfolio_ai.main:app", host="0.0.0.0", port=settings.PORT, reload=True)
