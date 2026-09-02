"""Admin dashboard stats. GET /api/admin/stats."""

from fastapi import APIRouter

from app.services import stats_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-stats"])


@router.get("/stats")
async def stats(db: DbSession, _admin: AdminUser) -> dict:
    return await stats_service.get_stats(db)
