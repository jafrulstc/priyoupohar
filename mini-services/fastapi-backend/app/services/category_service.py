"""Category business logic (admin + public)."""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category
from app.models.timestamps import utc_now
from app.utils.slugify import ensure_unique_slug, slugify


async def list_categories(db: AsyncSession, *, active_only: bool) -> list[Category]:
    stmt = select(Category).order_by(Category.id)
    if active_only:
        stmt = stmt.where(Category.is_active.is_(True))
    return list((await db.scalars(stmt)).all())


async def get_category(db: AsyncSession, category_id: int) -> Category | None:
    return await db.get(Category, category_id)


async def create_category(db: AsyncSession, data: dict) -> Category:
    """``data`` is CategoryIn.model_dump(); slug auto-generated when blank."""
    base = slugify(data.get("slug") or data["name"])
    category = Category(
        **{**data, "slug": await ensure_unique_slug(db, Category, base)},
        updated_at=utc_now(),
    )
    db.add(category)
    await db.commit()
    await db.refresh(category)
    return category


async def update_category(db: AsyncSession, category_id: int, data: dict) -> Category | None:
    """``data`` is CategoryUpdate.model_dump(exclude_unset=True)."""
    category = await get_category(db, category_id)
    if category is None:
        return None
    if data.get("slug"):
        base = slugify(data["slug"])
        data["slug"] = await ensure_unique_slug(db, Category, base, exclude_id=category.id)
    elif "name" in data and data.get("name") and "slug" not in data:
        base = slugify(data["name"])
        data["slug"] = await ensure_unique_slug(db, Category, base, exclude_id=category.id)
    for field, value in data.items():
        setattr(category, field, value)
    category.updated_at = utc_now()
    await db.commit()
    await db.refresh(category)
    return category


async def delete_category(db: AsyncSession, category_id: int) -> bool:
    category = await get_category(db, category_id)
    if category is None:
        return False
    await db.delete(category)
    await db.commit()
    return True
