"""Slug helpers (no external packages)."""

import re
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


def slugify(text: str) -> str:
    """Lowercase; runs of non-alphanumeric → '-'; trimmed dashes."""
    slug = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return slug or "item"


async def ensure_unique_slug(
    db: AsyncSession, model: Any, base: str, exclude_id: int | None = None
) -> str:
    """Return ``base`` or ``base-2`` / ``base-3`` … so the slug is unique.

    Rows whose PK equals ``exclude_id`` are ignored (used on partial updates).
    """
    rows = (await db.execute(select(model.id, model.slug).where(model.slug.like(f"{base}%")))).all()
    taken = {slug for row_id, slug in rows if row_id != exclude_id}
    if base not in taken:
        return base
    counter = 2
    while f"{base}-{counter}" in taken:
        counter += 1
    return f"{base}-{counter}"
