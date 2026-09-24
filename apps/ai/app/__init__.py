"""
Ceylon Weddings AI microservice.
Exposes three endpoints:
  POST /ai/chat        — streaming SSE chat assistant
  POST /ai/checklist   — personalised task list (JSON)
  POST /ai/budget      — LKR budget estimate (JSON)

Intended to be called only by the NestJS API (internal traffic).
"""

from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from openai import AsyncOpenAI

from .config import settings
from .routers import budget, chat, checklist

load_dotenv(Path(__file__).parent.parent.parent / ".env")  # monorepo root .env


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise shared OpenAI client on startup."""
    app.state.openai = AsyncOpenAI(api_key=settings.openai_api_key)
    yield
    await app.state.openai.close()


def create_app() -> FastAPI:
    app = FastAPI(
        title="Ceylon Weddings AI",
        version="0.1.0",
        description="AI planning assistant for Ceylon Weddings — Sri Lanka's wedding platform.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url="/redoc",
    )

    # Restrict CORS to the NestJS API origin only
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.allowed_origins,
        allow_methods=["POST", "GET"],
        allow_headers=["*"],
    )

    app.include_router(chat.router, prefix="/ai")
    app.include_router(checklist.router, prefix="/ai")
    app.include_router(budget.router, prefix="/ai")

    @app.get("/health", tags=["Health"])
    async def health():
        return {"status": "ok", "service": "ceylonweddings-ai"}

    return app


app = create_app()
