"""Idempotent seed script: schemas/tables, admin, demo customers, catalog, orders.

Run:  bun run seed   (cwd must be the fastapi-backend directory)
"""

import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from sqlalchemy import select  # noqa: E402

from app.core.database import SessionLocal  # noqa: E402
from app.core.init_db import init_db  # noqa: E402
from app.models import Category, Order, Product, User  # noqa: E402
from app.services.order_service import create_order  # noqa: E402
from app.utils.security import hash_password  # noqa: E402
from scripts.seed_data import (  # noqa: E402
    CATEGORIES,
    CUSTOMER_PROFILES,
    DEMO_CUSTOMERS,
    DESCRIPTIONS,
    P,
    PAIRS_WITH,
    SAME_DAY,
    SAMPLE_ORDERS,
    SEED_ORDER_NOTE,
    STOCK,
)


async def seed_users(
    db, admin_email: str, admin_password: str, admin_name: str
) -> tuple[int, list[User]]:
    created = 0
    users: list[User] = []
    for spec, role in (
        ({"name": admin_name, "email": admin_email, "password": admin_password}, "admin"),
        *[(c, "customer") for c in DEMO_CUSTOMERS],
    ):
        existing = await db.scalar(select(User).where(User.email == spec["email"]))
        if existing is not None:
            users.append(existing)
            continue
        user = User(
            name=spec["name"],
            email=spec["email"],
            password_hash=hash_password(spec["password"]),
            role=role,
        )
        db.add(user)
        created += 1
        users.append(user)
    await db.commit()
    return created, users


async def seed_categories(db) -> tuple[int, dict[str, Category]]:
    created = 0
    by_slug: dict[str, Category] = {}
    for spec in CATEGORIES:
        existing = await db.scalar(select(Category).where(Category.slug == spec["slug"]))
        if existing is not None:
            by_slug[spec["slug"]] = existing
            continue
        category = Category(**spec)
        db.add(category)
        by_slug[spec["slug"]] = category
        created += 1
    await db.commit()
    return created, by_slug


async def seed_products(db, categories: dict[str, Category]) -> int:
    created = 0
    for index, (name, slug, cat_slug, price, mrp, image, rating, reviews, badge) in enumerate(P):
        if await db.scalar(select(Product).where(Product.slug == slug)) is not None:
            continue
        db.add(
            Product(
                name=name,
                slug=slug,
                description=DESCRIPTIONS[slug],
                price=price,
                original_price=mrp,
                category_id=categories[cat_slug].id,
                image_url=image,
                gallery="[]",
                rating=rating,
                review_count=reviews,
                stock=STOCK[slug],
                is_featured=(badge == "Bestseller"),
                badge=badge,
                same_day=SAME_DAY[slug],
                pairs_with=PAIRS_WITH[slug],
                sort_order=index,
            )
        )
        created += 1
    await db.commit()
    return created


async def seed_orders(db, users: list[User]) -> int:
    # Idempotency: skip users who already have a seeded demo order.
    if await db.scalar(
        select(Order).where(Order.notes == SEED_ORDER_NOTE).limit(1)
    ) is not None:
        return 0

    products = {
        p.slug: p for p in (await db.scalars(select(Product))).all()
    }
    created = 0
    for customer_idx, status, items in SAMPLE_ORDERS:
        profile = CUSTOMER_PROFILES[customer_idx]
        user = users[customer_idx]
        order = await create_order(
            db,
            {
                "customer_name": user.name,
                "customer_phone": profile["phone"],
                "customer_email": profile["email_to"],
                "shipping_address": profile["address"],
                "city": profile["city"],
                "pincode": profile["pincode"],
                "items": [{"product_id": products[slug].id, "quantity": qty} for slug, qty in items],
                "notes": SEED_ORDER_NOTE,
            },
            user=user,
        )
        order.status = status
        await db.commit()
        created += 1
    return created


async def main() -> None:
    await init_db()
    from app.core.config import settings

    async with SessionLocal() as db:
        user_count, users = await seed_users(
            db, settings.admin_email, settings.admin_password, settings.admin_name
        )
        cat_count, categories = await seed_categories(db)
        product_count = await seed_products(db, categories)
        # users[0] = admin, users[1:] = demo customers (ravi, priya)
        order_count = await seed_orders(db, users[1:])

    print("Seed complete ✅")
    print(f"  users created:    {user_count} (admin={settings.admin_email}, ravi@demo.test, priya@demo.test)")
    print(f"  categories added: {cat_count} (total slugs: {len(categories)})")
    print(f"  products added:   {product_count} (16 expected on first run)")
    print(f"  orders added:     {order_count} (pending/shipped/delivered demo set)")


if __name__ == "__main__":
    asyncio.run(main())
