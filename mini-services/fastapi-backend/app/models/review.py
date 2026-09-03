"""Product reviews with moderation (``core`` schema).

Lifecycle: customer submits → status "pending" → admin approves/rejects.
Only "approved" reviews are returned by the public storefront endpoints and
reflected in the product's cached rating/review_count columns.
"""

from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.timestamps import utc_now


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(
        ForeignKey("core.products.id", ondelete="CASCADE"), index=True
    )
    name: Mapped[str] = mapped_column(String(80))
    city: Mapped[str | None] = mapped_column(String(80), nullable=True)
    rating: Mapped[int] = mapped_column(Integer)  # 1..5 enforced at app level
    title: Mapped[str | None] = mapped_column(String(160), nullable=True)
    text: Mapped[str] = mapped_column(Text)
    # status: "pending" | "approved" | "rejected" (Literal at app level).
    status: Mapped[str] = mapped_column(String(20), default="pending", index=True)
    helpful: Mapped[int] = mapped_column(Integer, default=0)
    user_id: Mapped[int | None] = mapped_column(
        ForeignKey("bb_auth.users.id", ondelete="SET NULL"), nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
