"""Product model — lives in the ``core`` PG schema."""

import json
from datetime import datetime
from decimal import Decimal

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.timestamps import utc_now


class Product(Base):
    __tablename__ = "products"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(200))
    slug: Mapped[str] = mapped_column(String(220), unique=True, index=True)
    description: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    original_price: Mapped[Decimal | None] = mapped_column(
        Numeric(10, 2), nullable=True
    )
    category_id: Mapped[int | None] = mapped_column(
        ForeignKey("core.categories.id", ondelete="SET NULL"), nullable=True, index=True
    )
    image_url: Mapped[str] = mapped_column(String(500), default="")
    # JSON-encoded list[str] of extra image urls (no ARRAY/JSON column per spec).
    gallery: Mapped[str] = mapped_column(Text, default="[]")
    rating: Mapped[float] = mapped_column(Float, default=4.5)
    review_count: Mapped[int] = mapped_column(Integer, default=0)
    stock: Mapped[int] = mapped_column(Integer, default=25)
    is_featured: Mapped[bool] = mapped_column(Boolean, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    badge: Mapped[str | None] = mapped_column(String(50), nullable=True)
    # Storefront parity fields (ported from the legacy Prisma model).
    same_day: Mapped[bool] = mapped_column(Boolean, default=True)
    pairs_with: Mapped[str | None] = mapped_column(String(300), nullable=True)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
    # Combo product support: JSON list of {product_id, name, qty}.
    is_combo: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    combo_items: Mapped[str] = mapped_column(Text, default="[]")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )

    category = relationship(
        "Category",
        back_populates="products",
        lazy="selectin",  # eager-load: safe for AsyncSession attribute access
    )

    @property
    def images(self) -> list[str]:
        """Parse the JSON-encoded gallery column into a list of urls."""
        try:
            parsed = json.loads(self.gallery or "[]")
        except (json.JSONDecodeError, TypeError):
            return []
        return [str(url) for url in parsed] if isinstance(parsed, list) else []

    @property
    def combo(self) -> list[dict]:
        """Parse the JSON-encoded combo_items column into a list of dicts."""
        try:
            parsed = json.loads(self.combo_items or "[]")
        except (json.JSONDecodeError, TypeError):
            return []
        return parsed if isinstance(parsed, list) else []
