"""Offers/banners business logic (Task 2.6) — validity-aware."""

from datetime import datetime, timezone

from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Offer
from app.models.timestamps import utc_now


def _now() -> datetime:
    return datetime.now(timezone.utc)


def _within_validity(offer: Offer, now: datetime) -> bool:
    if offer.starts_at is not None and offer.starts_at > now:
        return False
    if offer.ends_at is not None and offer.ends_at < now:
        return False
    return True


async def active_offers(db: AsyncSession, limit: int = 10) -> list[Offer]:
    """Public: active + inside validity window, priority first."""
    now = utc_now()
    stmt = (
        select(Offer)
        .where(
            Offer.is_active.is_(True),
            or_(Offer.starts_at.is_(None), Offer.starts_at <= now),
            or_(Offer.ends_at.is_(None), Offer.ends_at >= now),
        )
        .order_by(Offer.priority.desc(), Offer.id.asc())
        .limit(limit)
    )
    return list((await db.scalars(stmt)).all())


async def list_offers(db: AsyncSession) -> list[Offer]:
    """Admin: everything, with expired/upcoming flagged by the client."""
    stmt = select(Offer).order_by(Offer.priority.desc(), Offer.id.desc())
    return list((await db.scalars(stmt)).all())


async def get_offer(db: AsyncSession, offer_id: int) -> Offer | None:
    return await db.get(Offer, offer_id)


async def create_offer(db: AsyncSession, data: dict) -> Offer:
    offer = Offer(**data)
    db.add(offer)
    await db.commit()
    await db.refresh(offer)
    return offer


async def update_offer(db: AsyncSession, offer_id: int, data: dict) -> Offer | None:
    offer = await get_offer(db, offer_id)
    if offer is None:
        return None
    for field, value in data.items():
        setattr(offer, field, value)
    await db.commit()
    await db.refresh(offer)
    return offer


async def delete_offer(db: AsyncSession, offer_id: int) -> bool:
    offer = await get_offer(db, offer_id)
    if offer is None:
        return False
    await db.delete(offer)
    await db.commit()
    return True


async def count_offers(db: AsyncSession, *, active_only: bool = False) -> int:
    stmt = select(func.count()).select_from(Offer)
    if active_only:
        stmt = stmt.where(Offer.is_active.is_(True))
    return int(await db.scalar(stmt) or 0)
