"""Admin router aggregator — all sub-routers share the /api/admin prefix."""

from fastapi import APIRouter

from app.routers.admin import (
    categories,
    marketing,
    orders,
    products,
    reviews,
    site,
    stats,
    upload,
    users,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])
router.include_router(stats.router)
router.include_router(products.router)
router.include_router(categories.router)
router.include_router(orders.router)
router.include_router(users.router)
router.include_router(upload.router)
router.include_router(site.router)
router.include_router(marketing.router)
router.include_router(reviews.router)
