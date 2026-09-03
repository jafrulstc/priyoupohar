"""Product business logic (store + admin)."""

import json
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category, Product
from app.models.timestamps import utc_now
from app.utils.slugify import ensure_unique_slug, slugify


def _to_money(value: float | int | Decimal | None) -> Decimal | None:
    if value is None:
        return None
    return Decimal(str(value)).quantize(Decimal("0.01"))


def _gallery_to_json(images: list[str] | None) -> str:
    return json.dumps(images or [])


def _combo_to_json(combo: list[dict] | None) -> str:
    """Serialize combo rows ({product_id, name, qty}) into the Text column."""
    if not combo:
        return "[]"
    cleaned = [
        {
            "product_id": int(item["product_id"]),
            "name": str(item.get("name") or "")[:200],
            "qty": max(1, min(10, int(item.get("qty") or 1))),
        }
        for item in combo
        if item.get("product_id")
    ]
    return json.dumps(cleaned)


async def get_product(db: AsyncSession, product_id: int) -> Product | None:
    return await db.get(Product, product_id)


async def list_store_products(
    db: AsyncSession,
    *,
    category: str | None = None,
    q: str | None = None,
    featured: bool | None = None,
    slug: str | None = None,
    slugs: list[str] | None = None,
    limit: int = 12,
    offset: int = 0,
) -> tuple[list[Product], int]:
    """Public catalog: active only; featured first, then seed/display order."""
    stmt = select(Product).where(Product.is_active.is_(True))
    count_stmt = select(func.count()).select_from(Product).where(Product.is_active.is_(True))
    if category is not None:
        stmt = stmt.join(Category, Product.category_id == Category.id).where(
            Category.slug == category
        )
        count_stmt = (
            count_stmt.join(Category, Product.category_id == Category.id).where(
                Category.slug == category
            )
        )
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(Product.name.ilike(pattern))
        count_stmt = count_stmt.where(Product.name.ilike(pattern))
    if featured is not None:
        stmt = stmt.where(Product.is_featured.is_(featured))
        count_stmt = count_stmt.where(Product.is_featured.is_(featured))
    if slug is not None:
        stmt = stmt.where(Product.slug == slug)
        count_stmt = count_stmt.where(Product.slug == slug)
    if slugs:
        stmt = stmt.where(Product.slug.in_(slugs))
        count_stmt = count_stmt.where(Product.slug.in_(slugs))
    total = await db.scalar(count_stmt) or 0
    stmt = stmt.order_by(Product.is_featured.desc(), Product.sort_order.asc(), Product.id.asc()).limit(limit).offset(offset)
    items = list((await db.scalars(stmt)).all())
    return items, int(total)


async def get_store_product_by_slug(db: AsyncSession, slug: str) -> Product | None:
    stmt = select(Product).where(Product.slug == slug, Product.is_active.is_(True))
    return await db.scalar(stmt)


async def admin_list_products(
    db: AsyncSession,
    *,
    q: str | None = None,
    category_id: int | None = None,
    is_active: bool | None = None,
    limit: int = 20,
    offset: int = 0,
) -> tuple[list[Product], int]:
    stmt = select(Product)
    count_stmt = select(func.count()).select_from(Product)
    if q:
        pattern = f"%{q}%"
        stmt = stmt.where(Product.name.ilike(pattern))
        count_stmt = count_stmt.where(Product.name.ilike(pattern))
    if category_id is not None:
        stmt = stmt.where(Product.category_id == category_id)
        count_stmt = count_stmt.where(Product.category_id == category_id)
    if is_active is not None:
        stmt = stmt.where(Product.is_active.is_(is_active))
        count_stmt = count_stmt.where(Product.is_active.is_(is_active))
    total = await db.scalar(count_stmt) or 0
    stmt = stmt.order_by(Product.id.desc()).limit(limit).offset(offset)
    items = list((await db.scalars(stmt)).all())
    return items, int(total)


async def _validate_category(db: AsyncSession, category_id: int | None) -> None:
    if category_id is not None and await db.get(Category, category_id) is None:
        raise ValueError(f"Category {category_id} does not exist")


async def create_product(db: AsyncSession, data: dict) -> Product:
    """``data`` is ProductIn.model_dump(); slug auto-generated & uniquified."""
    await _validate_category(db, data.get("category_id"))
    images = data.pop("images", None)
    combo = data.pop("combo", None)
    base = slugify(data.get("slug") or data["name"])
    product = Product(
        **{
            **data,
            "slug": await ensure_unique_slug(db, Product, base),
            "gallery": _gallery_to_json(images),
            "combo_items": _combo_to_json(combo),
            "price": _to_money(data["price"]),
            "original_price": _to_money(data.get("original_price")),
            "updated_at": utc_now(),
        }
    )
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return product


async def update_product(db: AsyncSession, product_id: int, data: dict) -> Product | None:
    """``data`` is ProductUpdate.model_dump(exclude_unset=True)."""
    product = await get_product(db, product_id)
    if product is None:
        return None
    await _validate_category(db, data.get("category_id"))
    if "images" in data:
        product.gallery = _gallery_to_json(data.pop("images"))
    if "combo" in data:
        product.combo_items = _combo_to_json(data.pop("combo"))
    if data.get("slug"):
        data["slug"] = await ensure_unique_slug(
            db, Product, slugify(data["slug"]), exclude_id=product.id
        )
    elif "name" in data and data.get("name") and "slug" not in data:
        data["slug"] = await ensure_unique_slug(
            db, Product, slugify(data["name"]), exclude_id=product.id
        )
    if "price" in data and data["price"] is not None:
        data["price"] = _to_money(data["price"])
    if "original_price" in data:
        data["original_price"] = _to_money(data["original_price"])
    for field, value in data.items():
        setattr(product, field, value)
    product.updated_at = utc_now()
    await db.commit()
    await db.refresh(product)
    return product


async def delete_product(db: AsyncSession, product_id: int) -> bool:
    product = await get_product(db, product_id)
    if product is None:
        return False
    await db.delete(product)
    await db.commit()
    return True
