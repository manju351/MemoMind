from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import get_settings
from .db import init_db
from .routers import cards, decks


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(title="FlashForge API", version="0.1.0", lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(cards.router, prefix="/api", tags=["cards"])
    app.include_router(decks.router, prefix="/api", tags=["decks"])

    @app.get("/health")
    def health() -> dict:
        return {"status": "ok", "model": settings.llm_model, "base_url": settings.llm_base_url}

    return app


app = create_app()
