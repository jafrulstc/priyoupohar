"""Async SQLAlchemy engine / session / declarative base.

Backend dialects
----------------
- Postgres (Supabase): real CREATE SCHEMA targets (bb_auth / core / orders).
- SQLite (sandbox-resilient fallback): each schema is an ATTACH-ed database
  file whose alias equals the schema name, so ``core.products``-style names
  resolve unchanged. One file per schema avoids cross-file write deadlocks.
"""

from collections.abc import AsyncIterator

from sqlalchemy import event
from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

# FastAPI-owned schemas (per-module separation). `auth` is RESERVED by
# Supabase, so users live in `bb_auth` — the only possible deviation.
SCHEMA_NAMES: tuple[str, ...] = ("bb_auth", "core", "orders")

IS_SQLITE = settings.database_url.startswith("sqlite")

SQLITE_DIR: object = None
if IS_SQLITE:
    from pathlib import Path

    SQLITE_DIR = Path(settings.sqlite_dir)
    SQLITE_DIR.mkdir(parents=True, exist_ok=True)

_engine_kwargs: dict = {"echo": False, "pool_pre_ping": True}
if not IS_SQLITE:
    _engine_kwargs["connect_args"] = {"statement_cache_size": 0}  # pgbouncer-safe

engine = create_async_engine(settings.database_url, **_engine_kwargs)


class Base(DeclarativeBase):
    """Declarative base for all models (tables live in auth/core/orders schemas)."""


if IS_SQLITE:

    @event.listens_for(engine.sync_engine, "connect")
    def _attach_sqlite_schemas(dbapi_connection: object, _record: object) -> None:
        """ATTACH one file per schema so schema-qualified tables resolve.

        The aiosqlite dialect's connection adapter exposes a sync-compatible
        ``execute()`` (greenlet await_), so this runs transparently in the
        pool's connect hook. Attaching is idempotent per fresh connection.
        """
        for schema in SCHEMA_NAMES:
            path = SQLITE_DIR / f"{schema}.db"  # type: ignore[union-attr]
            dbapi_connection.execute(  # type: ignore[attr-defined]
                f'ATTACH DATABASE "{path}" AS "{schema}"'
            )


SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False,
)


async def get_db() -> AsyncIterator[AsyncSession]:
    """Yield a session per request; always closes it."""
    async with SessionLocal() as session:
        yield session
