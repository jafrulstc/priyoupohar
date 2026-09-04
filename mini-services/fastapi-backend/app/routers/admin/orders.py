"""Admin order management. /api/admin/orders."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, Query, status

from app.schemas.order import OrderOut, OrderStatusUpdate
from app.services import order_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-orders"])


@router.get("/orders")
async def list_orders(
    db: DbSession,
    _admin: AdminUser,
    status_filter: Annotated[str | None, Query(alias="status")] = None,
    limit: Annotated[int, Query(ge=1, le=100)] = 20,
    offset: Annotated[int, Query(ge=0)] = 0,
) -> dict:
    items, total = await order_service.admin_list_orders(
        db, status=status_filter, limit=limit, offset=offset
    )
    return {"items": [OrderOut.model_validate(o) for o in items], "total": total}


@router.patch("/orders/{order_id}", response_model=OrderOut)
async def update_order_status(
    payload: OrderStatusUpdate,
    db: DbSession,
    _admin: AdminUser,
    order_id: Annotated[int, Path(gt=0)],
) -> OrderOut:
    order = await order_service.update_order_status(db, order_id, payload.status)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    return OrderOut.model_validate(order)


@router.get("/orders/{order_id}/timeline")
async def order_timeline(
    db: DbSession,
    _admin: AdminUser,
    order_id: Annotated[int, Path(gt=0)],
) -> dict:
    """Status history for the admin order-detail dialog (Task 2.3)."""
    order = await order_service.get_order(db, order_id)
    if order is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Order not found")
    events = await order_service.get_timeline(db, order)
    return {
        "events": [
            {
                "id": e.id,
                "status": e.status,
                "note": e.note,
                "created_at": e.created_at.isoformat(),
            }
            for e in events
        ]
    }
