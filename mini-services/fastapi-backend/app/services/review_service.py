"""Review business logic (Task 2.8) — moderation + product rating sync."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Product, Review
from app.models.timestamps import utc_now

APPROVED = "approved"
PENDING = "pending"
REJECTED = "rejected"


async def list_for_product(
    db: AsyncSession, product_id: int, *, approved_only: bool = True
) -> list[Review]:
    stmt = select(Review).where(Review.product_id == product_id)
    if approved_only:
        stmt = stmt.where(Review.status == APPROVED)
    stmt = stmt.order_by(Review.created_at.desc(), Review.id.desc()).limit(50)
    return list((await db.scalars(stmt)).all())


async def summary_for_product(db: AsyncSession, product_id: int) -> dict:
    """Aggregate approved reviews → {average, count, distribution}."""
    rows = (
        await db.execute(
            select(Review.rating, func.count())
            .where(Review.product_id == product_id, Review.status == APPROVED)
            .group_by(Review.rating)
        )
    ).all()
    distribution = {int(rating): int(count) for rating, count in rows}
    count = sum(distribution.values())
    total = sum(rating * count for rating, count in distribution.items())
    average = round(total / count, 1) if count else 0.0
    return {"average": average, "count": count, "distribution": distribution}


async def create_review(
    db: AsyncSession, product_id: int, data: dict, user_id: int | None = None
) -> Review:
    review = Review(
        product_id=product_id,
        name=data["name"].strip(),
        city=(data.get("city") or "").strip() or None,
        rating=max(1, min(5, int(data["rating"]))),
        title=(data.get("title") or "").strip() or None,
        text=data["text"].strip(),
        status=PENDING,  # moderation queue — never auto-approve
        user_id=user_id,
    )
    db.add(review)
    await db.commit()
    await db.refresh(review)
    return review


async def admin_list_reviews(
    db: AsyncSession, *, status: str | None = None, product_id: int | None = None
) -> tuple[list[Review], int]:
    stmt = select(Review)
    count_stmt = select(func.count()).select_from(Review)
    if status:
        stmt = stmt.where(Review.status == status)
        count_stmt = count_stmt.where(Review.status == status)
    if product_id is not None:
        stmt = stmt.where(Review.product_id == product_id)
        count_stmt = count_stmt.where(Review.product_id == product_id)
    total = await db.scalar(count_stmt) or 0
    stmt = stmt.order_by(Review.created_at.desc(), Review.id.desc()).limit(100)
    return list((await db.scalars(stmt)).all()), int(total)


async def get_review(db: AsyncSession, review_id: int) -> Review | None:
    return await db.get(Review, review_id)


async def moderate_review(
    db: AsyncSession, review_id: int, *, status: str, helpful: int | None = None
) -> Review | None:
    review = await get_review(db, review_id)
    if review is None:
        return None
    review.status = status
    if helpful is not None:
        review.helpful = max(0, int(helpful))
    review.updated_at = utc_now()
    await db.commit()
    await db.refresh(review)
    await sync_product_rating(db, review.product_id)
    return review


async def delete_review(db: AsyncSession, review_id: int) -> bool:
    review = await get_review(db, review_id)
    if review is None:
        return False
    product_id = review.product_id
    await db.delete(review)
    await db.commit()
    await sync_product_rating(db, product_id)
    return True


async def sync_product_rating(db: AsyncSession, product_id: int) -> None:
    """Recompute the cached rating / review_count columns on the product."""
    summary = await summary_for_product(db, product_id)
    product = await db.get(Product, product_id)
    if product is None:
        return
    product.rating = summary["average"] or product.rating
    product.review_count = summary["count"]
    await db.commit()
