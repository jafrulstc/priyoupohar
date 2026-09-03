"""Site settings business logic (Task 2.1).

Settings live in a key/value table with JSON-encoded values. Typed defaults
guarantee the storefront keeps working even with an empty table.
"""

import json

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SiteSetting

TYPED_DEFAULTS: dict[str, object] = {
    "free_delivery_threshold": 999,
    "delivery_fee": 99,
    "cod_enabled": True,
    "support_phone": "+91 98765 43210",
    "support_email": "care@bloombliss.test",
    "store_name": "Bloom & Bliss",
    "announcement_enabled": True,
}

# Keys the admin is allowed to write (never trust arbitrary input).
EDITABLE_KEYS = frozenset(TYPED_DEFAULTS.keys())


async def get_settings(db: AsyncSession) -> dict[str, object]:
    """Merge DB rows over typed defaults → full settings dict."""
    rows = (await db.scalars(select(SiteSetting))).all()
    merged: dict[str, object] = dict(TYPED_DEFAULTS)
    for row in rows:
        if row.key not in EDITABLE_KEYS:
            continue
        try:
            merged[row.key] = json.loads(row.value)
        except (json.JSONDecodeError, TypeError):
            continue  # keep default on corrupt value
    return merged


async def get_int(db: AsyncSession, key: str) -> int:
    """Numeric accessor used by order pricing (threshold / fee)."""
    settings = await get_settings(db)
    value = settings.get(key, 0)
    try:
        return int(float(value))  # type: ignore[arg-type]
    except (TypeError, ValueError):
        return 0


async def update_settings(db: AsyncSession, data: dict) -> dict[str, object]:
    """``data`` is SiteSettingsUpdate.model_dump(exclude_unset=True)."""
    for key, value in data.items():
        if key not in EDITABLE_KEYS or value is None:
            continue
        row = await db.get(SiteSetting, key)
        if row is None:
            row = SiteSetting(key=key, value=json.dumps(value))
            db.add(row)
        else:
            row.value = json.dumps(value)
    await db.commit()
    return await get_settings(db)
