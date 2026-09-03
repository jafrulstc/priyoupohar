"""Review schemas — public + moderation."""

from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

ReviewStatus = Literal["pending", "approved", "rejected"]


class ReviewOut(BaseModel):
    """Public (approved) or admin review payload."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int
    name: str
    city: str | None = None
    rating: int
    title: str | None = None
    text: str
    status: ReviewStatus
    helpful: int
    created_at: datetime


class ReviewIn(BaseModel):
    """Customer submission — always lands as 'pending' moderation."""

    name: str = Field(min_length=1, max_length=80)
    city: str | None = Field(default=None, max_length=80)
    rating: int = Field(ge=1, le=5)
    title: str | None = Field(default=None, max_length=160)
    text: str = Field(min_length=3, max_length=2000)


class ReviewSummary(BaseModel):
    average: float
    count: int
    distribution: dict[int, int]  # rating → count


class ReviewModeration(BaseModel):
    status: ReviewStatus
    helpful: int | None = Field(default=None, ge=0)
