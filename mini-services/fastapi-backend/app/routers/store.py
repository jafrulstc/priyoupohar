"""Public storefront router. Prefix /api/store (no auth required)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.models import Product
from app.schemas.category import CategoryOut
from app.schemas.marketing import OfferOut, SpinConfigOut, SpinPrizeOut
from app.schemas.order import (
    OrderCreateIn,
    OrderEventOut,
    OrderOut,
    OrderTimelineOut,
    OrderWrappedOut,
)
from app.schemas.product import ProductOut
from app.schemas.review import ReviewIn, ReviewOut, ReviewSummary
from app.schemas.site import ServiceabilityOut, SiteSettingsOut
from app.services import (
    category_service,
    location_service,
    offer_service,
    order_service,
    product_service,
    review_service,
    settings_service,
    spin_service,
)
from app.utils.deps import CurrentUser, DbSession, OptionalUser

router = APIRouter(prefix="/api/store", tags=["store"])


@router.get("/products")
async def list_products(
    db: DbSession,
    category: Annotated[str | None, Query(description="Filter by category slug")] = None,
    q: Annotated[str | None, Query(description="Case-insensitive name search")] = None,
    featured: Annotated[bool | None, Query(description="Only featured products")] = None,
    slug: Annotated[str | None, Query(description="Exact slug lookup")] = None,
    slugs: Annotated[str | None, Query(description="Comma-separated slug list")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 12,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict:
    slug_list = [s.strip() for s in slugs.split(",") if s.strip()] if slugs else None
    items, total = await product_service.list_store_products(
        db, category=category, q=q, featured=featured, slug=slug,
        slugs=slug_list, limit=limit, offset=offset,
    )
    return {
        "items": [ProductOut.model_validate(p) for p in items],
        "total": total,
    }


@router.get("/products/{slug}", response_model=ProductOut)
async def get_product(
    db: DbSession,
    slug: Annotated[str, Path(min_length=1, max_length=220)],
) -> ProductOut:
    product = await product_service.get_store_product_by_slug(db, slug)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return ProductOut.model_validate(product)


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: DbSession) -> list[CategoryOut]:
    categories = await category_service.list_categories(db, active_only=True)
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("/orders", status_code=status.HTTP_201_CREATED, response_model=OrderWrappedOut)
async def create_order(
    payload: OrderCreateIn, db: DbSession, user: OptionalUser
) -> OrderWrappedOut:
    try:
        order = await order_service.create_order(
            db, payload.model_dump(), user=user
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from None
    return OrderWrappedOut(order=OrderOut.model_validate(order))


@router.get("/orders/{order_number}", response_model=OrderWrappedOut)
async def track_order(
    db: DbSession,
    order_number: Annotated[str, Path(min_length=3, max_length=30)],
) -> OrderWrappedOut:
    order = await order_service.get_by_order_number(db, order_number)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return OrderWrappedOut(order=OrderOut.model_validate(order))


# --------------------------------------------------------------------------
# Task 2.1 — site settings
# --------------------------------------------------------------------------
@router.get("/settings", response_model=SiteSettingsOut)
async def store_settings(db: DbSession) -> SiteSettingsOut:
    return SiteSettingsOut(**await settings_service.get_settings(db))


# --------------------------------------------------------------------------
# Task 2.2 — DB-driven serviceability
# --------------------------------------------------------------------------
@router.get("/locations/serviceability", response_model=ServiceabilityOut)
async def store_serviceability(
    db: DbSession,
    pincode: Annotated[str, Query(min_length=3, max_length=6)],
) -> ServiceabilityOut:
    verdict = await location_service.serviceability(db, pincode.strip())
    return ServiceabilityOut(**verdict)


# --------------------------------------------------------------------------
# Task 2.3 — order tracking timeline
# --------------------------------------------------------------------------
@router.get("/orders/{order_number}/timeline", response_model=OrderTimelineOut)
async def track_order_timeline(
    db: DbSession,
    order_number: Annotated[str, Path(min_length=3, max_length=30)],
) -> OrderTimelineOut:
    order = await order_service.get_by_order_number(db, order_number)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    events = await order_service.get_timeline(db, order)
    return OrderTimelineOut(
        order=OrderOut.model_validate(order),
        events=[OrderEventOut.model_validate(e) for e in events],
    )


# --------------------------------------------------------------------------
# Task 2.4 — customer's own orders (requires login)
# --------------------------------------------------------------------------
@router.get("/my-orders")
async def my_orders(db: DbSession, user: CurrentUser) -> dict:
    orders = await order_service.list_orders_for_user(db, user.id)
    return {
        "items": [OrderOut.model_validate(o) for o in orders],
        "total": len(orders),
    }


# --------------------------------------------------------------------------
# Task 2.6 — active offers/banners
# --------------------------------------------------------------------------
@router.get("/offers")
async def store_offers(db: DbSession) -> list[OfferOut]:
    rows = await offer_service.active_offers(db)
    return [OfferOut.model_validate(o) for o in rows]


# --------------------------------------------------------------------------
# Task 2.7 — spin-wheel config
# --------------------------------------------------------------------------
@router.get("/spin", response_model=SpinConfigOut)
async def store_spin_config(db: DbSession) -> SpinConfigOut:
    prizes = await spin_service.list_prizes(db, active_only=True)
    return SpinConfigOut(
        segments=[SpinPrizeOut.model_validate(p) for p in prizes], cooldown_hours=24
    )


# --------------------------------------------------------------------------
# Task 2.8 — product reviews (approved) + submission (pending moderation)
# --------------------------------------------------------------------------
async def _product_by_slug_or_id(db: DbSession, slug_or_id: str):
    """Accept either a product slug or a numeric id (robust for clients)."""
    if slug_or_id.isdigit():
        product = await db.get(Product, int(slug_or_id))
        if product is not None and product.is_active:
            return product
    return await product_service.get_store_product_by_slug(db, slug_or_id)


@router.get("/products/{slug}/reviews")
async def product_reviews(
    db: DbSession, slug: Annotated[str, Path(min_length=1, max_length=220)]
) -> dict:
    product = await _product_by_slug_or_id(db, slug)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    reviews = await review_service.list_for_product(db, product.id, approved_only=True)
    summary = await review_service.summary_for_product(db, product.id)
    return {
        "items": [ReviewOut.model_validate(r) for r in reviews],
        "summary": ReviewSummary(**summary),
    }


@router.post(
    "/products/{slug}/reviews",
    status_code=status.HTTP_201_CREATED,
    response_model=ReviewOut,
)
async def submit_review(
    payload: ReviewIn,
    db: DbSession,
    slug: Annotated[str, Path(min_length=1, max_length=220)],
    user: OptionalUser,
) -> ReviewOut:
    product = await _product_by_slug_or_id(db, slug)
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    review = await review_service.create_review(
        db, product.id, payload.model_dump(), user_id=user.id if user else None
    )
    return ReviewOut.model_validate(review)
