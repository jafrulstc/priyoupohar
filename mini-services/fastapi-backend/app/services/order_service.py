"""Order business logic: guest checkout, tracking, admin listing/updates."""

import secrets
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Order, OrderItem, Product, User
from app.models.timestamps import utc_now

FREE_SHIPPING_THRESHOLD = Decimal("999")
# Aligned with the legacy storefront checkout fee (₹99).
DELIVERY_FEE = Decimal("99")


def generate_order_number() -> str:
    """BB-{YYMMDD}-{4 random hex uppercase}."""
    stamp = datetime.now(timezone.utc).strftime("%y%m%d")
    return f"BB-{stamp}-{secrets.token_hex(2).upper()}"


async def get_by_order_number(db: AsyncSession, order_number: str) -> Order | None:
    return await db.scalar(select(Order).where(Order.order_number == order_number))


async def get_order(db: AsyncSession, order_id: int) -> Order | None:
    return await db.get(Order, order_id)


async def create_order(
    db: AsyncSession, data: dict, user: User | None = None
) -> Order:
    """Atomic guest checkout. ``data`` is OrderCreateIn.model_dump().

    Raises ValueError with a customer-safe message → router maps to 400.
    """
    items = data["items"]
    product_ids = [item["product_id"] for item in items]
    products = {
        p.id: p
        for p in (
            await db.scalars(select(Product).where(Product.id.in_(product_ids)))
        ).all()
    }

    lines: list[tuple[Product, int, Decimal]] = []
    for item in items:
        product = products.get(item["product_id"])
        if product is None:
            raise ValueError(f"Product {item['product_id']} does not exist")
        if not product.is_active:
            raise ValueError(f"Product '{product.name}' is currently unavailable")
        quantity = item["quantity"]
        if product.stock < quantity:
            raise ValueError(
                f"Insufficient stock for '{product.name}' "
                f"({product.stock} left, {quantity} requested)"
            )
        unit_price = Decimal(str(product.price)).quantize(Decimal("0.01"))
        lines.append((product, quantity, unit_price))

    items_total = sum(
        (unit_price * Decimal(quantity) for _, quantity, unit_price in lines),
        Decimal("0"),
    ).quantize(Decimal("0.01"))
    delivery_fee = (
        Decimal("0") if items_total >= FREE_SHIPPING_THRESHOLD else DELIVERY_FEE
    )
    # Client-computed discount (loyalty coupons); clamped to a sane range.
    raw_discount = Decimal(str(data.get("discount") or 0)).quantize(Decimal("0.01"))
    discount = max(Decimal("0"), min(raw_discount, items_total))
    # Optional add-on fees from the storefront (e.g. ₹49 premium velvet wrap).
    extra_fees = max(Decimal("0"), Decimal(str(data.get("extra_fees") or 0)))
    total = items_total + delivery_fee + extra_fees - discount

    order = Order(
        order_number=generate_order_number(),
        user_id=user.id if user is not None else None,
        customer_name=data["customer_name"].strip(),
        customer_phone=data["customer_phone"].strip(),
        customer_email=data.get("customer_email"),
        shipping_address=data["shipping_address"].strip(),
        city=data["city"].strip(),
        pincode=data["pincode"].strip(),
        items_total=items_total,
        delivery_fee=delivery_fee,
        discount=discount,
        total=total,
        status="pending",
        notes=data.get("notes"),
        created_at=utc_now(),
        updated_at=utc_now(),
    )
    for product, quantity, unit_price in lines:
        order.items.append(
            OrderItem(
                product_id=product.id,
                product_name=product.name,
                unit_price=unit_price,
                quantity=quantity,
                line_total=(unit_price * Decimal(quantity)).quantize(Decimal("0.01")),
            )
        )
        product.stock -= quantity  # decrement stock, same transaction
    db.add(order)
    await db.commit()  # single atomic transaction (stock + order + items)
    await db.refresh(order)
    return order


async def admin_list_orders(
    db: AsyncSession,
    *,
    status: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Order], int]:
    stmt = select(Order)
    count_stmt = select(func.count()).select_from(Order)
    if status is not None:
        stmt = stmt.where(Order.status == status)
        count_stmt = count_stmt.where(Order.status == status)
    total = await db.scalar(count_stmt) or 0
    stmt = stmt.order_by(Order.created_at.desc(), Order.id.desc()).limit(limit).offset(offset)
    items = list((await db.scalars(stmt)).all())
    return items, int(total)


async def update_order_status(
    db: AsyncSession, order_id: int, status: str
) -> Order | None:
    order = await get_order(db, order_id)
    if order is None:
        return None
    order.status = status
    order.updated_at = utc_now()
    await db.commit()
    await db.refresh(order)
    return order
