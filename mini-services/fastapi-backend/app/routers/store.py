"""Public storefront router. Prefix /api/store (no auth required)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.category import CategoryOut
from app.schemas.order import OrderCreateIn, OrderOut, OrderWrappedOut
from app.schemas.product import ProductOut
from app.services import category_service, order_service, product_service
from app.utils.deps import DbSession, OptionalUser

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
