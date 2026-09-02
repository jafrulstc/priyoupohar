"""Startup bootstrap: create PG schemas + all tables (idempotent)."""

from sqlalchemy import text

from app.core.database import Base, engine

# FastAPI-owned Postgres schemas (per-module separation, user requirement).
# NOTE: `auth` is RESERVED by Supabase (supabase_auth_admin owns auth.users with
# a UUID pk), so our users table lives in `bb_auth` — the only possible deviation.
SCHEMAS: tuple[str, ...] = ("bb_auth", "core", "orders")


async def init_db() -> None:
    """CREATE SCHEMA IF NOT EXISTS ... then Base.metadata.create_all + column backfills."""
    async with engine.begin() as conn:
        for schema in SCHEMAS:
            await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
        await conn.run_sync(Base.metadata.create_all)
        # Idempotent column additions for tables created before these fields
        # existed (create_all does not ALTER existing tables).
        for ddl in (
            'ALTER TABLE core.products ADD COLUMN IF NOT EXISTS same_day BOOLEAN NOT NULL DEFAULT TRUE',
            'ALTER TABLE core.products ADD COLUMN IF NOT EXISTS pairs_with VARCHAR(300)',
            'ALTER TABLE core.products ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0',
        ):
            await conn.execute(text(ddl))
