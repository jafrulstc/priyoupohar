"""Admin product CRUD. /api/admin/products."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.product import ProductIn, ProductOut, ProductUpdate
from app.services import product_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-products"])


@router.get("/products")
async def list_products(
    db: DbSession,
    _admin: AdminUser,
    q: Annotated[str | None, Query(description="Name contains")] = None,
    category_id: Annotated[int | None, Query(ge=1)] = None,
    is_active: Annotated[bool | None, Query()] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict:
    items, total = await product_service.admin_list_products(
        db, q=q, category_id=category_id, is_active=is_active, limit=limit, offset=offset
    )
    return {"items": [ProductOut.model_validate(p) for p in items], "total": total}


@router.post("/products", status_code=status.HTTP_201_CREATED, response_model=ProductOut)
async def create_product(payload: ProductIn, db: DbSession, _admin: AdminUser) -> ProductOut:
    try:
        product = await product_service.create_product(db, payload.model_dump())
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from None
    return ProductOut.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductOut)
async def update_product(
    payload: ProductUpdate,
    db: DbSession,
    _admin: AdminUser,
    product_id: Annotated[int, Path(gt=0)],
) -> ProductOut:
    try:
        product = await product_service.update_product(
            db, product_id, payload.model_dump(exclude_unset=True)
        )
    except ValueError as exc:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, str(exc)) from None
    if product is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return ProductOut.model_validate(product)


@router.delete("/products/{product_id}")
async def delete_product(
    db: DbSession,
    _admin: AdminUser,
    product_id: Annotated[int, Path(gt=0)],
) -> dict:
    deleted = await product_service.delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Product not found")
    return {"ok": True}
