"""Admin offers/banners + spin-wheel management (Tasks 2.6, 2.7)."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status

from app.schemas.marketing import (
    OfferIn,
    OfferOut,
    OfferUpdate,
    SpinPrizeIn,
    SpinPrizeOut,
    SpinPrizeUpdate,
)
from app.services import offer_service, spin_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-marketing"])


# ------------------------------------------------------------------ offers
@router.get("/offers", response_model=list[OfferOut])
async def list_offers(db: DbSession, _admin: AdminUser) -> list[OfferOut]:
    rows = await offer_service.list_offers(db)
    return [OfferOut.model_validate(r) for r in rows]


@router.post("/offers", response_model=OfferOut, status_code=status.HTTP_201_CREATED)
async def create_offer(
    payload: OfferIn, db: DbSession, _admin: AdminUser
) -> OfferOut:
    row = await offer_service.create_offer(db, payload.model_dump())
    return OfferOut.model_validate(row)


@router.patch("/offers/{offer_id}", response_model=OfferOut)
async def update_offer(
    payload: OfferUpdate,
    db: DbSession,
    _admin: AdminUser,
    offer_id: Annotated[int, Path(gt=0)],
) -> OfferOut:
    row = await offer_service.update_offer(
        db, offer_id, payload.model_dump(exclude_unset=True)
    )
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offer not found")
    return OfferOut.model_validate(row)


@router.delete("/offers/{offer_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_offer(
    db: DbSession, _admin: AdminUser, offer_id: Annotated[int, Path(gt=0)]
) -> None:
    if not await offer_service.delete_offer(db, offer_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Offer not found")


# ------------------------------------------------------------ spin prizes
@router.get("/spin/prizes", response_model=list[SpinPrizeOut])
async def list_spin_prizes(db: DbSession, _admin: AdminUser) -> list[SpinPrizeOut]:
    rows = await spin_service.list_prizes(db)
    return [SpinPrizeOut.model_validate(r) for r in rows]


@router.post(
    "/spin/prizes",
    response_model=SpinPrizeOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_spin_prize(
    payload: SpinPrizeIn, db: DbSession, _admin: AdminUser
) -> SpinPrizeOut:
    row = await spin_service.create_prize(db, payload.model_dump())
    return SpinPrizeOut.model_validate(row)


@router.patch("/spin/prizes/{prize_id}", response_model=SpinPrizeOut)
async def update_spin_prize(
    payload: SpinPrizeUpdate,
    db: DbSession,
    _admin: AdminUser,
    prize_id: Annotated[int, Path(gt=0)],
) -> SpinPrizeOut:
    row = await spin_service.upsert_prize(
        db, prize_id, payload.model_dump(exclude_unset=True)
    )
    if row is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prize not found")
    return SpinPrizeOut.model_validate(row)


@router.delete("/spin/prizes/{prize_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_spin_prize(
    db: DbSession, _admin: AdminUser, prize_id: Annotated[int, Path(gt=0)]
) -> None:
    if not await spin_service.delete_prize(db, prize_id):
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Prize not found")
