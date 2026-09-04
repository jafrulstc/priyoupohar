"""Admin review moderation (Task 2.8)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.review import ReviewModeration, ReviewOut
from app.services import review_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-reviews"])


@router.get("/reviews")
async def list_reviews(
    db: DbSession,
    _admin: AdminUser,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    product_id: Annotated[int | None, Query(gt=0)] = None,
) -> dict:
    items, total = await review_service.admin_list_reviews(
        db, status=status_filter, product_id=product_id
    )
    return {"items": [ReviewOut.model_validate(r) for r in items], "total": total}


@router.patch("/reviews/{review_id}", response_model=ReviewOut)
async def moderate_review(
    payload: ReviewModeration,
    db: DbSession,
    _admin: AdminUser,
    review_id: Annotated[int, Path(gt=0)],
) -> ReviewOut:
    review = await review_service.moderate_review(
        db, review_id, status=payload.status, helpful=payload.helpful
    )
    if review is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
    return ReviewOut.model_validate(review)


@router.delete("/reviews/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_review(
    db: DbSession, _admin: AdminUser, review_id: Annotated[int, Path(gt=0)]
) -> None:
    if not await review_service.delete_review(db, review_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Review not found")
