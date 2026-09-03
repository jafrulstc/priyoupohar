"""Marketing models — offers/banners + spin-wheel prizes (``core`` schema).

Offers have validity windows (starts_at / ends_at) and surface on the
announcement bar. SpinPrize rows define the 8 wheel segments; admins can
re-label prizes, adjust colours, win probability (weight) and enable/disable
segments without a redeploy.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.timestamps import utc_now


class Offer(Base):
    __tablename__ = "offers"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    message: Mapped[str] = mapped_column(String(300), default="")
    # Icon name from lucide-react (frontend maps it; unknown → Sparkles).
    icon: Mapped[str] = mapped_column(String(30), default="sparkles")
    accent: Mapped[bool] = mapped_column(Boolean, default=False)
    # Optional promo code shown alongside the message.
    code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    starts_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), nullable=True
    )
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    priority: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class SpinPrize(Base):
    __tablename__ = "spin_prizes"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    label: Mapped[str] = mapped_column(String(40))
    # kind: "percent" | "flat" | "freeship" | "none" (none = losing segment).
    kind: Mapped[str] = mapped_column(String(20), default="none")
    code: Mapped[str | None] = mapped_column(String(40), nullable=True)
    value: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    weight: Mapped[int] = mapped_column(Integer, default=1)
    bg: Mapped[str] = mapped_column(String(20), default="#E11D48")
    fg: Mapped[str] = mapped_column(String(20), default="#FFFFFF")
    position: Mapped[int] = mapped_column(Integer, default=0)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
