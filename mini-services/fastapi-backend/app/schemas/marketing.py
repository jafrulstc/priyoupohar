"""Marketing schemas — offers/banners + spin-wheel prizes."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

OfferKind = Literal["percent", "flat", "freeship", "none"]
SpinKind = Literal["percent", "flat", "freeship", "none"]


class OfferOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    message: str
    icon: str
    accent: bool
    code: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    priority: int
    is_active: bool
    created_at: datetime
    updated_at: datetime


class OfferIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    message: str = Field(default="", max_length=300)
    icon: str = Field(default="sparkles", max_length=30)
    accent: bool = False
    code: str | None = Field(default=None, max_length=40)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    priority: int = 0
    is_active: bool = True


class OfferUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=160)
    message: str | None = Field(default=None, max_length=300)
    icon: str | None = Field(default=None, max_length=30)
    accent: bool | None = None
    code: str | None = Field(default=None, max_length=40)
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    priority: int | None = None
    is_active: bool | None = None


class SpinPrizeOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    label: str
    kind: SpinKind
    code: str | None = None
    value: float | None = None
    weight: int
    bg: str
    fg: str
    position: int
    is_active: bool
    updated_at: datetime


class SpinPrizeIn(BaseModel):
    label: str = Field(min_length=1, max_length=40)
    kind: SpinKind = "none"
    code: str | None = Field(default=None, max_length=40)
    value: float | None = Field(default=None, ge=0)
    weight: int = Field(default=1, ge=0, le=100)
    bg: str = Field(default="#E11D48", max_length=20)
    fg: str = Field(default="#FFFFFF", max_length=20)
    position: int = Field(default=0, ge=0)
    is_active: bool = True


class SpinPrizeUpdate(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=40)
    kind: SpinKind | None = None
    code: str | None = Field(default=None, max_length=40)
    value: float | None = Field(default=None, ge=0)
    weight: int | None = Field(default=None, ge=0, le=100)
    bg: str | None = Field(default=None, max_length=20)
    fg: str | None = Field(default=None, max_length=20)
    position: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class SpinConfigOut(BaseModel):
    """Public wheel config — winning segments + probabilities included so the
    client wheel matches admin's odds exactly."""

    segments: list[SpinPrizeOut]
    cooldown_hours: int = 24
