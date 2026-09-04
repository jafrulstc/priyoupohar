"""Reusable Annotated FastAPI dependencies (DB session, current user, admin)."""

from typing import Annotated

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.models import User
from app.utils.security import decode_access_token

bearer_scheme = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_db)]
BearerCreds = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)]

_UNAUTHORIZED = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="Not authenticated",
    headers={"WWW-Authenticate": "Bearer"},
)
_FORBIDDEN = HTTPException(
    status_code=status.HTTP_403_FORBIDDEN,
    detail="Admin privileges required",
)


def _user_id_from_credentials(credentials: BearerCreds) -> int:
    """Extract the user id from bearer credentials; 401 on any problem."""
    if credentials is None or not credentials.credentials:
        raise _UNAUTHORIZED
    payload = decode_access_token(credentials.credentials)
    if not payload or "sub" not in payload:
        raise _UNAUTHORIZED
    try:
        return int(payload["sub"])  # type: ignore[arg-type]
    except (TypeError, ValueError):
        raise _UNAUTHORIZED from None


async def get_current_user(db: DbSession, credentials: BearerCreds) -> User:
    """401 for missing/invalid/expired tokens or deactivated accounts."""
    user_id = _user_id_from_credentials(credentials)
    user = await db.get(User, user_id)
    if user is None or not user.is_active:
        raise _UNAUTHORIZED
    return user


async def get_optional_user(db: DbSession, credentials: BearerCreds) -> User | None:
    """Best-effort user resolution for public endpoints (guest checkout)."""
    if credentials is None or not credentials.credentials:
        return None
    try:
        user_id = _user_id_from_credentials(credentials)
    except HTTPException:
        return None
    user = await db.get(User, user_id)
    return user if user is not None and user.is_active else None


CurrentUser = Annotated[User, Depends(get_current_user)]
OptionalUser = Annotated[User | None, Depends(get_optional_user)]


async def get_current_admin(user: CurrentUser) -> User:
    if user.role != "admin":
        raise _FORBIDDEN
    return user


AdminUser = Annotated[User, Depends(get_current_admin)]
