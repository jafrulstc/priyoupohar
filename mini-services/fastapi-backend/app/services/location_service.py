"""Delivery location business logic (Task 2.2) + order pricing integration.

Serviceability is now DB-driven: an admin-managed DeliveryLocation whose
``pincode_prefix`` matches the lookup wins; otherwise the global delivery fee
from site settings applies to any non-empty pincode (defaults serviceable).
"""

from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import DeliveryLocation
from app.services import settings_service


def _match_length(prefix: str) -> int:
    return len(prefix.strip())


async def list_locations(
    db: AsyncSession, *, active_only: bool = False
) -> list[DeliveryLocation]:
    stmt = select(DeliveryLocation)
    if active_only:
        stmt = stmt.where(DeliveryLocation.is_active.is_(True))
    # Longest prefix wins ordering context; exact list ordering by prefix.
    stmt = stmt.order_by(DeliveryLocation.pincode_prefix.asc())
    return list((await db.scalars(stmt)).all())


async def get_location(db: AsyncSession, location_id: int) -> DeliveryLocation | None:
    return await db.get(DeliveryLocation, location_id)


async def create_location(db: AsyncSession, data: dict) -> DeliveryLocation:
    location = DeliveryLocation(
        pincode_prefix=data["pincode_prefix"].strip(),
        city=data["city"].strip(),
        state=data["state"].strip(),
        delivery_fee=Decimal(str(data.get("delivery_fee") or 0)),
        free_above=(
            Decimal(str(data["free_above"])) if data.get("free_above") is not None else None
        ),
        same_day=bool(data.get("same_day")),
        midnight_available=bool(data.get("midnight_available")),
        cod_available=bool(data.get("cod_available", True)),
        eta_hours=int(data.get("eta_hours") or 24),
        is_active=bool(data.get("is_active", True)),
    )
    db.add(location)
    await db.commit()
    await db.refresh(location)
    return location


async def update_location(
    db: AsyncSession, location_id: int, data: dict
) -> DeliveryLocation | None:
    location = await get_location(db, location_id)
    if location is None:
        return None
    mapping = {
        "pincode_prefix": lambda v: v.strip(),
        "city": lambda v: v.strip(),
        "state": lambda v: v.strip(),
        "delivery_fee": lambda v: Decimal(str(v)),
        "free_above": lambda v: None if v is None else Decimal(str(v)),
        "eta_hours": lambda v: int(v),
    }
    for field, value in data.items():
        if value is None and field != "free_above":
            continue
        setattr(location, field, mapping.get(field, lambda v: v)(value))
    await db.commit()
    await db.refresh(location)
    return location


async def delete_location(db: AsyncSession, location_id: int) -> bool:
    location = await get_location(db, location_id)
    if location is None:
        return False
    await db.delete(location)
    await db.commit()
    return True


async def serviceability(db: AsyncSession, pincode: str) -> dict:
    """DB-driven verdict; longest matching active prefix wins."""
    settings = await settings_service.get_settings(db)
    global_threshold = float(settings.get("free_delivery_threshold") or 999)

    pincode = pincode.strip()
    if not pincode:
        return {"serviceable": False, "free_delivery_threshold": global_threshold}

    active = await list_locations(db, active_only=True)
    best: DeliveryLocation | None = None
    best_len = 0
    for loc in active:
        prefix = loc.pincode_prefix.strip()
        if prefix and pincode.startswith(prefix) and _match_length(prefix) > best_len:
            best, best_len = loc, _match_length(prefix)

    if best is None:
        # No location row covers this pincode → still deliverable at the
        # standard national fee (admin can add exclusions by disabling rows).
        return {
            "serviceable": True,
            "city": "",
            "state": "",
            "same_day": False,
            "midnight_available": False,
            "cod_available": bool(settings.get("cod_enabled", True)),
            "eta_hours": 48,
            "delivery_fee": float(settings.get("delivery_fee") or 99),
            "free_above": None,
            "free_delivery_threshold": global_threshold,
        }

    return {
        "serviceable": True,
        "city": best.city,
        "state": best.state,
        "same_day": best.same_day,
        "midnight_available": best.midnight_available,
        "cod_available": best.cod_available and bool(settings.get("cod_enabled", True)),
        "eta_hours": best.eta_hours,
        "delivery_fee": float(best.delivery_fee),
        "free_above": float(best.free_above) if best.free_above is not None else None,
        "free_delivery_threshold": global_threshold,
    }


async def delivery_fee_for(
    db: AsyncSession, pincode: str, items_total: Decimal
) -> Decimal:
    """Fee used by order_service.create_order — location-aware."""
    verdict = await serviceability(db, pincode)
    if not verdict["serviceable"]:
        return Decimal(0)
    threshold = verdict.get("free_above") or verdict.get("free_delivery_threshold") or 999
    if items_total >= Decimal(str(threshold)):
        return Decimal(0)
    return Decimal(str(verdict["delivery_fee"])).quantize(Decimal("0.01"))


async def count_locations(db: AsyncSession) -> int:
    return int(await db.scalar(select(func.count()).select_from(DeliveryLocation)) or 0)
