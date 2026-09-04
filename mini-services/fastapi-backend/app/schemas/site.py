"""Site settings + delivery location schemas."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

# Task 2.2 — no pg enums; Literal enforced at app level.
DeliveryLocationIn_ = Literal  # re-export alias for readability


class SiteSettingsOut(BaseModel):
    """Public store settings — safe fields only."""

    free_delivery_threshold: float = 999
    delivery_fee: float = 99
    cod_enabled: bool = True
    support_phone: str = ""
    support_email: str = ""
    store_name: str = "Bloom & Bliss"
    announcement_enabled: bool = True


class SiteSettingsUpdate(BaseModel):
    """Admin partial update — all optional; unknown keys are ignored."""

    free_delivery_threshold: float | None = Field(default=None, ge=0)
    delivery_fee: float | None = Field(default=None, ge=0)
    cod_enabled: bool | None = None
    support_phone: str | None = Field(default=None, max_length=30)
    support_email: str | None = Field(default=None, max_length=255)
    store_name: str | None = Field(default=None, max_length=80)
    announcement_enabled: bool | None = None


class DeliveryLocationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    pincode_prefix: str
    city: str
    state: str
    delivery_fee: float
    free_above: float | None = None
    same_day: bool
    midnight_available: bool
    cod_available: bool
    eta_hours: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class DeliveryLocationIn(BaseModel):
    pincode_prefix: str = Field(min_length=1, max_length=6)
    city: str = Field(min_length=1, max_length=80)
    state: str = Field(min_length=1, max_length=80)
    delivery_fee: float = Field(default=0, ge=0)
    free_above: float | None = Field(default=None, ge=0)
    same_day: bool = False
    midnight_available: bool = False
    cod_available: bool = True
    eta_hours: int = Field(default=24, ge=1, le=720)
    is_active: bool = True


class DeliveryLocationUpdate(BaseModel):
    pincode_prefix: str | None = Field(default=None, min_length=1, max_length=6)
    city: str | None = Field(default=None, min_length=1, max_length=80)
    state: str | None = Field(default=None, min_length=1, max_length=80)
    delivery_fee: float | None = Field(default=None, ge=0)
    free_above: float | None = Field(default=None, ge=0)
    same_day: bool | None = None
    midnight_available: bool | None = None
    cod_available: bool | None = None
    eta_hours: int | None = Field(default=None, ge=1, le=720)
    is_active: bool | None = None


class ServiceabilityOut(BaseModel):
    """DB-driven verdict for a pincode (replaces the hardcoded simulator)."""

    serviceable: bool
    city: str = "—"
    state: str = ""
    same_day: bool = False
    midnight_available: bool = False
    cod_available: bool = False
    eta_hours: int = 0
    delivery_fee: float = 0
    free_above: float | None = None
    free_delivery_threshold: float = 999  # global fallback when location has none
