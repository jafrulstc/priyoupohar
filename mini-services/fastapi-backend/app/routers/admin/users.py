"""Admin user management. /api/admin/users."""

from typing import Annotated

from fastapi import APIRouter, HTTPException, Path, status
from sqlalchemy import select

from app.models import User
from app.schemas.auth import UserUpdateIn
from app.schemas.user import UserOut
from app.services import auth_service
from app.utils.deps import AdminUser, DbSession

router = APIRouter(tags=["admin-users"])


@router.get("/users", response_model=list[UserOut])
async def list_users(db: DbSession, _admin: AdminUser) -> list[UserOut]:
    users = list((await db.scalars(select(User).order_by(User.id))).all())
    return [UserOut.model_validate(u) for u in users]


@router.patch("/users/{user_id}", response_model=UserOut)
async def update_user(
    payload: UserUpdateIn,
    db: DbSession,
    admin: AdminUser,
    user_id: Annotated[int, Path(gt=0)],
) -> UserOut:
    user = await auth_service.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(user, field, value)
    await db.commit()
    await db.refresh(user)
    return UserOut.model_validate(user)


@router.delete("/users/{user_id}")
async def delete_user(
    db: DbSession,
    admin: AdminUser,
    user_id: Annotated[int, Path(gt=0)],
) -> dict:
    if user_id == admin.id:
        raise HTTPException(status.HTTP_409_CONFLICT, "You cannot delete your own account")
    user = await auth_service.get_by_id(db, user_id)
    if user is None:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "User not found")
    await db.delete(user)
    await db.commit()
    return {"ok": True}
