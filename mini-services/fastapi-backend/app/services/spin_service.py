"""Spin-wheel business logic (Task 2.7) — DB-configured segments + odds."""

import secrets

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import SpinPrize


async def list_prizes(db: AsyncSession, *, active_only: bool = False) -> list[SpinPrize]:
    stmt = select(SpinPrize).order_by(SpinPrize.position.asc(), SpinPrize.id.asc())
    if active_only:
        stmt = stmt.where(SpinPrize.is_active.is_(True))
    return list((await db.scalars(stmt)).all())


async def get_prize(db: AsyncSession, prize_id: int) -> SpinPrize | None:
    return await db.get(SpinPrize, prize_id)


async def upsert_prize(db: AsyncSession, prize_id: int, data: dict) -> SpinPrize | None:
    """Admin edit of a wheel segment (label/kind/weight/colours/position)."""
    prize = await get_prize(db, prize_id)
    if prize is None:
        return None
    for field, value in data.items():
        if value is None:
            continue
        setattr(prize, field, value)
    await db.commit()
    await db.refresh(prize)
    return prize


async def create_prize(db: AsyncSession, data: dict) -> SpinPrize:
    prize = SpinPrize(**data)
    db.add(prize)
    await db.commit()
    await db.refresh(prize)
    return prize


async def delete_prize(db: AsyncSession, prize_id: int) -> bool:
    prize = await get_prize(db, prize_id)
    if prize is None:
        return False
    await db.delete(prize)
    await db.commit()
    return True


def pick_segment(prizes: list[SpinPrize]) -> int:
    """Weighted random index among active segments.

    Losing segments (kind == "none") also carry weight, so admin-controlled
    odds exactly match the wheel the customer sees. Falls back to uniform.
    """
    active = [p for p in prizes if p.is_active]
    if not active:
        return 0
    weights = [max(0, int(p.weight or 0)) for p in active]
    total = sum(weights)
    if total <= 0:
        return prizes.index(active[secrets.randbelow(len(active))])
    roll = secrets.randbelow(total)
    cumulative = 0
    for idx, weight in enumerate(weights):
        cumulative += weight
        if roll < cumulative:
            return prizes.index(active[idx])
    return len(prizes) - 1
