"""Shared model helpers."""

from datetime import UTC, datetime


def utc_now() -> datetime:
    """Timezone-aware UTC now (naive-utcnow is deprecated on 3.12)."""
    return datetime.now(UTC)
