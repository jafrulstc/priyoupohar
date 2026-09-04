"""Admin dashboard statistics."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Category, Order, Product, User


async def get_stats(db: AsyncSession) -> dict[str, int | float]:
    products = await db.scalar(select(func.count()).select_from(Product)) or 0
    categories = await db.scalar(select(func.count()).select_from(Category)) or 0
    orders = await db.scalar(select(func.count()).select_from(Order)) or 0
    users = await db.scalar(select(func.count()).select_from(User)) or 0
    revenue = await db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(Order.status != "cancelled")
    )
    pending_orders = await db.scalar(
        select(func.count()).select_from(Order).where(Order.status == "pending")
    ) or 0
    low_stock = await db.scalar(
        select(func.count()).select_from(Product).where(Product.stock < 5)
    ) or 0
    return {
        "products": int(products),
        "categories": int(categories),
        "orders": int(orders),
        "users": int(users),
        "revenue": float(revenue or 0),
        "pending_orders": int(pending_orders),
        "low_stock": int(low_stock),
    }
