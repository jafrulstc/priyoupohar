"""Product schemas (admin + store)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryBrief(BaseModel):
    """Nested category summary inside ProductOut."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str


class ComboItem(BaseModel):
    product_id: int = Field(gt=0)
    name: str = Field(default="", max_length=200)
    qty: int = Field(default=1, ge=1, le=10)


class ProductOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str
    slug: str
    description: str
    price: float
    original_price: float | None = None
    category_id: int | None = None
    category: CategoryBrief | None = None
    image_url: str
    images: list[str] = []
    rating: float
    review_count: int
    stock: int
    is_featured: bool
    is_active: bool
    badge: str | None = None
    same_day: bool = True
    pairs_with: str | None = None
    sort_order: int = 0
    is_combo: bool = False
    combo: list[ComboItem] = []
    created_at: datetime
    updated_at: datetime


class ProductIn(BaseModel):
    """Admin create — only ``name`` is required; slug auto-generated if blank."""

    name: str = Field(min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    description: str = ""
    price: float = Field(default=0, ge=0)
    original_price: float | None = Field(default=None, ge=0)
    category_id: int | None = None
    image_url: str = Field(default="", max_length=500)
    images: list[str] = []
    rating: float = Field(default=4.5, ge=0, le=5)
    review_count: int = Field(default=0, ge=0)
    stock: int = Field(default=25, ge=0)
    is_featured: bool = False
    is_active: bool = True
    badge: str | None = Field(default=None, max_length=50)
    same_day: bool = True
    pairs_with: str | None = Field(default=None, max_length=300)
    sort_order: int = Field(default=0, ge=0)
    is_combo: bool = False
    combo: list[ComboItem] = []


class ProductUpdate(BaseModel):
    """Admin partial update — all fields optional."""

    name: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, max_length=220)
    description: str | None = None
    price: float | None = Field(default=None, ge=0)
    original_price: float | None = Field(default=None, ge=0)
    category_id: int | None = None
    image_url: str | None = Field(default=None, max_length=500)
    images: list[str] | None = None
    rating: float | None = Field(default=None, ge=0, le=5)
    review_count: int | None = Field(default=None, ge=0)
    stock: int | None = Field(default=None, ge=0)
    is_featured: bool | None = None
    is_active: bool | None = None
    badge: str | None = Field(default=None, max_length=50)
    same_day: bool | None = None
    pairs_with: str | None = Field(default=None, max_length=300)
    sort_order: int | None = Field(default=None, ge=0)
    is_combo: bool | None = None
    combo: list[ComboItem] | None = None
