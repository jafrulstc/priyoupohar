"""Site-wide settings + delivery locations — live in the ``core`` schema.

SiteSetting is a simple key/value store (JSON-encoded values) so the admin
panel can tune storefront behaviour (free-delivery threshold, fees, contact
info) without redeploying. DeliveryLocation drives pincode serviceability and
per-zone delivery fees instead of the legacy hardcoded simulator.
"""

from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, DateTime, Integer, Numeric, String
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base
from app.models.timestamps import utc_now


class SiteSetting(Base):
    __tablename__ = "site_settings"
    __table_args__ = {"schema": "core"}

    key: Mapped[str] = mapped_column(String(80), primary_key=True)
    value: Mapped[str] = mapped_column(String(500), default="")  # JSON-encoded
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )


class DeliveryLocation(Base):
    __tablename__ = "delivery_locations"
    __table_args__ = {"schema": "core"}

    id: Mapped[int] = mapped_column(primary_key=True)
    pincode_prefix: Mapped[str] = mapped_column(String(6), index=True)  # 3-6 digit prefix
    city: Mapped[str] = mapped_column(String(80))
    state: Mapped[str] = mapped_column(String(80))
    delivery_fee: Mapped[Decimal] = mapped_column(Numeric(10, 2), default=0)
    free_above: Mapped[Decimal | None] = mapped_column(Numeric(10, 2), nullable=True)
    same_day: Mapped[bool] = mapped_column(Boolean, default=False)
    midnight_available: Mapped[bool] = mapped_column(Boolean, default=False)
    cod_available: Mapped[bool] = mapped_column(Boolean, default=True)
    eta_hours: Mapped[int] = mapped_column(Integer, default=24)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=utc_now, onupdate=utc_now
    )
