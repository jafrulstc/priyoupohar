"""Bloom & Bliss FastAPI application factory (kept minimal)."""

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.init_db import init_db
from app.routers import auth, store
from app.routers.admin import router as admin_router
from app.routers.media import router as media_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await init_db()  # create schemas + tables (idempotent)
    yield


def create_app() -> FastAPI:
    app = FastAPI(
        title="Bloom & Bliss API",
        description="Backend for the Bloom & Bliss gift/flower shop (FastAPI + Postgres).",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router)
    app.include_router(store.router)
    app.include_router(admin_router)
    app.include_router(media_router)

    @app.get("/api/health", tags=["health"])
    async def health() -> dict:
        return {"status": "ok", "service": "bloom-bliss-api"}

    return app


app = create_app()
