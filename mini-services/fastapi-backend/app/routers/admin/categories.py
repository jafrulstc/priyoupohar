"""Admin category CRUD. /api/admin/categories."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.schemas.category import CategoryIn, CategoryOut, CategoryUpdate
from app.services import category_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-categories"])


@router.get("/categories", response_model=list[CategoryOut])
async def list_categories(db: DbSession, _admin: AdminUser) -> list[CategoryOut]:
    categories = await category_service.list_categories(db, active_only=False)
    return [CategoryOut.model_validate(c) for c in categories]


@router.post("/categories", status_code=status.HTTP_201_CREATED, response_model=CategoryOut)
async def create_category(payload: CategoryIn, db: DbSession, _admin: AdminUser) -> CategoryOut:
    category = await category_service.create_category(db, payload.model_dump())
    return CategoryOut.model_validate(category)


@router.patch("/categories/{category_id}", response_model=CategoryOut)
async def update_category(
    payload: CategoryUpdate,
    db: DbSession,
    _admin: AdminUser,
    category_id: Annotated[int, Path(gt=0)],
) -> CategoryOut:
    category = await category_service.update_category(
        db, category_id, payload.model_dump(exclude_unset=True)
    )
    if category is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return CategoryOut.model_validate(category)


@router.delete("/categories/{category_id}")
async def delete_category(
    db: DbSession,
    _admin: AdminUser,
    category_id: Annotated[int, Path(gt=0)],
) -> dict:
    deleted = await category_service.delete_category(db, category_id)
    if not deleted:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Category not found")
    return {"ok": True}
