"""Admin site-settings + delivery-location management (Tasks 2.1, 2.2)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.schemas.site import (
    DeliveryLocationIn,
    DeliveryLocationOut,
    DeliveryLocationUpdate,
    SiteSettingsOut,
    SiteSettingsUpdate,
)
from app.services import location_service, settings_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-site"])


# ---------------------------------------------------------------- settings
@router.get("/settings", response_model=SiteSettingsOut)
async def get_settings(db: DbSession, _admin: AdminUser) -> SiteSettingsOut:
    return SiteSettingsOut(**await settings_service.get_settings(db))


@router.patch("/settings", response_model=SiteSettingsOut)
async def update_settings(
    payload: SiteSettingsUpdate, db: DbSession, _admin: AdminUser
) -> SiteSettingsOut:
    updated = await settings_service.update_settings(
        db, payload.model_dump(exclude_unset=True)
    )
    return SiteSettingsOut(**updated)


# --------------------------------------------------------------- locations
@router.get("/locations", response_model=list[DeliveryLocationOut])
async def list_locations(db: DbSession, _admin: AdminUser) -> list[DeliveryLocationOut]:
    rows = await location_service.list_locations(db)
    return [DeliveryLocationOut.model_validate(r) for r in rows]


@router.post(
    "/locations",
    response_model=DeliveryLocationOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_location(
    payload: DeliveryLocationIn, db: DbSession, _admin: AdminUser
) -> DeliveryLocationOut:
    row = await location_service.create_location(db, payload.model_dump())
    return DeliveryLocationOut.model_validate(row)


@router.patch("/locations/{location_id}", response_model=DeliveryLocationOut)
async def update_location(
    payload: DeliveryLocationUpdate,
    db: DbSession,
    _admin: AdminUser,
    location_id: Annotated[int, Path(gt=0)],
) -> DeliveryLocationOut:
    row = await location_service.update_location(
        db, location_id, payload.model_dump(exclude_unset=True)
    )
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
    return DeliveryLocationOut.model_validate(row)


@router.delete("/locations/{location_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_location(
    db: DbSession, _admin: AdminUser, location_id: Annotated[int, Path(gt=0)]
) -> None:
    if not await location_service.delete_location(db, location_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Location not found")
