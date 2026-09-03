"""Startup bootstrap: create schemas + all tables (idempotent).

- Postgres: CREATE SCHEMA IF NOT EXISTS + metadata.create_all + ADD COLUMN IF
  NOT EXISTS backfills.
- SQLite: schemas are ATTACH-ed files (see database.py); column backfills use
  PRAGMA table_info checks because SQLite lacks ADD COLUMN IF NOT EXISTS.
"""

import json
from datetime import datetime, timedelta, timezone

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncConnection, AsyncSession

from app.core.database import IS_SQLITE, SCHEMA_NAMES, Base, engine

# Re-exported under the historical name for main.py / scripts/seed.py.
SCHEMAS: tuple[str, ...] = SCHEMA_NAMES

# (schema, table, column, DDL) — columns added after a table's first release.
COLUMN_BACKFILLS: tuple[tuple[str, str, str, str], ...] = (
    ("core", "products", "same_day", "BOOLEAN NOT NULL DEFAULT TRUE"),
    ("core", "products", "pairs_with", "VARCHAR(300)"),
    ("core", "products", "sort_order", "INTEGER NOT NULL DEFAULT 0"),
    ("core", "products", "is_combo", "BOOLEAN NOT NULL DEFAULT 0"),
    ("core", "products", "combo_items", "TEXT NOT NULL DEFAULT '[]'"),
)

_PG_BACKFILL_DDLS: tuple[str, ...] = tuple(
    f'ALTER TABLE {schema}.{table} ADD COLUMN IF NOT EXISTS {column} {ddl}'
    for schema, table, column, ddl in COLUMN_BACKFILLS
)


async def _pg_bootstrap(conn: AsyncConnection) -> None:
    """Postgres path: real schemas + idempotent ALTERs."""
    for schema in SCHEMAS:
        await conn.execute(text(f'CREATE SCHEMA IF NOT EXISTS "{schema}"'))
    await conn.run_sync(Base.metadata.create_all)
    for ddl in _PG_BACKFILL_DDLS:
        await conn.execute(text(ddl))


async def _sqlite_backfill(conn: AsyncConnection) -> None:
    """SQLite path: ADD COLUMN for legacy DBs (no-op on fresh files)."""
    for schema, table, column, ddl in COLUMN_BACKFILLS:
        info = await conn.exec_driver_sql(
            f'PRAGMA "{schema}".table_info("{table}")'
        )
        rows = info.fetchall()
        if not rows:
            continue  # table not created yet; create_all covers it
        existing = {row[1] for row in rows}
        if column not in existing:
            await conn.exec_driver_sql(
                f'ALTER TABLE "{schema}"."{table}" ADD COLUMN "{column}" {ddl}'
            )


async def _seed_defaults() -> None:
    """First-boot seeds for settings / locations / offers / spin prizes.

    Idempotent: each table is only seeded when completely empty, so admin
    edits are never clobbered by restarts.
    """
    from app.models import DeliveryLocation, Offer, SiteSetting, SpinPrize

    session = AsyncSession(engine, expire_on_commit=False)
    try:
        # -- Site settings (Task 2.1) -----------------------------------
        defaults: dict[str, str] = {
            "free_delivery_threshold": "999",
            "delivery_fee": "99",
            "cod_enabled": "true",
            "support_phone": "+91 98765 43210",
            "support_email": "care@bloombliss.test",
            "store_name": "Bloom & Bliss",
            "announcement_enabled": "true",
        }
        if (await session.scalar(select(SiteSetting.key).limit(1))) is None:
            session.add_all(
                SiteSetting(key=k, value=v) for k, v in defaults.items()
            )

        # -- Delivery locations (Task 2.2) -------------------------------
        if (await session.scalar(select(DeliveryLocation.id).limit(1))) is None:
            session.add_all(
                [
                    DeliveryLocation(
                        pincode_prefix="110", city="New Delhi", state="Delhi",
                        delivery_fee=0, free_above=499, same_day=True,
                        midnight_available=True, cod_available=True, eta_hours=4,
                    ),
                    DeliveryLocation(
                        pincode_prefix="400", city="Mumbai", state="Maharashtra",
                        delivery_fee=0, free_above=499, same_day=True,
                        midnight_available=True, cod_available=True, eta_hours=4,
                    ),
                    DeliveryLocation(
                        pincode_prefix="560", city="Bengaluru", state="Karnataka",
                        delivery_fee=49, free_above=999, same_day=True,
                        midnight_available=False, cod_available=True, eta_hours=8,
                    ),
                    DeliveryLocation(
                        pincode_prefix="600", city="Chennai", state="Tamil Nadu",
                        delivery_fee=49, free_above=999, same_day=False,
                        midnight_available=False, cod_available=True, eta_hours=24,
                    ),
                    DeliveryLocation(
                        pincode_prefix="700", city="Kolkata", state="West Bengal",
                        delivery_fee=79, free_above=1499, same_day=False,
                        midnight_available=False, cod_available=True, eta_hours=36,
                    ),
                    DeliveryLocation(
                        pincode_prefix="500", city="Hyderabad", state="Telangana",
                        delivery_fee=49, free_above=999, same_day=True,
                        midnight_available=False, cod_available=True, eta_hours=12,
                    ),
                    DeliveryLocation(
                        pincode_prefix="411", city="Pune", state="Maharashtra",
                        delivery_fee=49, free_above=999, same_day=True,
                        midnight_available=False, cod_available=True, eta_hours=8,
                    ),
                    DeliveryLocation(
                        pincode_prefix="302", city="Jaipur", state="Rajasthan",
                        delivery_fee=79, free_above=1499, same_day=False,
                        midnight_available=False, cod_available=True, eta_hours=36,
                    ),
                ]
            )

        # -- Offers / banners (Task 2.6) ---------------------------------
        if (await session.scalar(select(Offer.id).limit(1))) is None:
            now = datetime.now(timezone.utc)
            session.add_all(
                [
                    Offer(
                        title="Free delivery on orders above \u20b9999",
                        message="", icon="truck", accent=True,
                        starts_at=now - timedelta(days=30),
                        ends_at=now + timedelta(days=180), priority=10,
                    ),
                    Offer(
                        title="Use BLISS10 for 10% off your first order",
                        message="New customer exclusive", icon="percent",
                        accent=True, code="BLISS10",
                        starts_at=now - timedelta(days=30),
                        ends_at=now + timedelta(days=90), priority=8,
                    ),
                    Offer(
                        title="Same-day & midnight delivery available",
                        message="Order before 6 PM", icon="clock",
                        starts_at=now - timedelta(days=30),
                        ends_at=now + timedelta(days=365), priority=5,
                    ),
                ]
            )

        # -- Spin-wheel prizes (Task 2.7) --------------------------------
        if (await session.scalar(select(SpinPrize.id).limit(1))) is None:
            session.add_all(
                [
                    SpinPrize(label="15% OFF", kind="percent", code="SPIN15",
                              value=15, weight=2, bg="#E11D48", fg="#FFFFFF", position=0),
                    SpinPrize(label="\u20b950 OFF", kind="flat", code="JOY50",
                              value=50, weight=3, bg="#F59E0B", fg="#292524", position=1),
                    SpinPrize(label="TRY AGAIN", kind="none", weight=6,
                              bg="#9F1239", fg="#FECDD3", position=2),
                    SpinPrize(label="FREE SHIP", kind="freeship", code="SHIPFREE",
                              weight=2, bg="#FBBF24", fg="#292524", position=3),
                    SpinPrize(label="10% OFF", kind="percent", code="BLISS10",
                              value=10, weight=3, bg="#E11D48", fg="#FFFFFF", position=4),
                    SpinPrize(label="BETTER LUCK", kind="none", weight=5,
                              bg="#B45309", fg="#FDE68A", position=5),
                    SpinPrize(label="\u20b950 OFF", kind="flat", code="JOY50",
                              value=50, weight=3, bg="#F59E0B", fg="#292524", position=6),
                    SpinPrize(label="SO CLOSE", kind="none", weight=4,
                              bg="#9F1239", fg="#FECDD3", position=7),
                ]
            )

        await session.commit()
    finally:
        await session.close()


async def init_db() -> None:
    """Ensure schemas + all tables exist (idempotent, safe every boot)."""
    async with engine.begin() as conn:
        if IS_SQLITE:
            # ATTACH aliases already registered on connect; just create tables.
            await conn.run_sync(Base.metadata.create_all)
            await _sqlite_backfill(conn)
        else:
            await _pg_bootstrap(conn)
    await _seed_defaults()
    # Ensure combo JSON stays valid on legacy rows.
    if not IS_SQLITE:
        return
    from app.models import Product

    session = AsyncSession(engine, expire_on_commit=False)
    try:
        rows = (await session.scalars(select(Product))).all()
        changed = False
        for p in rows:
            try:
                json.loads(p.combo_items or "[]")
            except (json.JSONDecodeError, TypeError):
                p.combo_items = "[]"
                changed = True
        if changed:
            await session.commit()
    finally:
        await session.close()
