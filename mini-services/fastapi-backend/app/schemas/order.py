"""Order schemas (guest checkout + admin)."""

from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import ORDER_STATUSES, EmailStrT


class OrderItemIn(BaseModel):
    product_id: int = Field(gt=0)
    quantity: int = Field(ge=1, le=20)


class OrderCreateIn(BaseModel):
    """Guest checkout. Customer fields are optional so the lightweight
    storefront demo checkout can persist orders without a full address form."""

    customer_name: str = Field(default="Guest", max_length=120)
    customer_phone: str = Field(default="", max_length=30)
    customer_email: EmailStrT | None = None
    shipping_address: str = Field(default="", max_length=2000)
    city: str = Field(min_length=1, max_length=80)
    pincode: str = Field(min_length=3, max_length=12)
    items: list[OrderItemIn] = Field(min_length=1)
    notes: str | None = Field(default=None, max_length=2000)
    discount: float = Field(default=0, ge=0)
    extra_fees: float = Field(default=0, ge=0)


class OrderItemOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    product_id: int | None = None
    product_name: str
    unit_price: float
    quantity: int
    line_total: float


class OrderOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    order_number: str
    user_id: int | None = None
    customer_name: str
    customer_phone: str
    customer_email: str | None = None
    shipping_address: str
    city: str
    pincode: str
    items_total: float
    delivery_fee: float
    discount: float
    total: float
    status: str
    notes: str | None = None
    created_at: datetime
    updated_at: datetime
    items: list[OrderItemOut] = []


class OrderWrappedOut(BaseModel):
    """Envelope for order endpoints → ``{"order": OrderOut}`` per contract."""

    order: OrderOut


class OrderStatusUpdate(BaseModel):
    status: ORDER_STATUSES


class OrderEventOut(BaseModel):
    """Single status-history entry (Task 2.3 tracking timeline)."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    status: str
    note: str | None = None
    created_at: datetime


class OrderTimelineOut(BaseModel):
    """Public tracking payload: order summary + full status history."""

    order: OrderOut
    events: list[OrderEventOut] = []
