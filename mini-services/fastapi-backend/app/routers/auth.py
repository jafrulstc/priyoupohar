"""Auth router: register / login / me. Prefix /api/auth."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.auth import LoginIn, RegisterIn, TokenResponse
from app.schemas.user import UserOut
from app.services import auth_service
from app.utils.deps import CurrentUser, DbSession
from app.utils.security import create_access_token

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _token_response(user) -> TokenResponse:
    return TokenResponse(
        access_token=create_access_token(sub=str(user.id), role=user.role),
        token_type="bearer",
        user=UserOut.model_validate(user),
    )


@router.post("/register", status_code=status.HTTP_201_CREATED, response_model=TokenResponse)
async def register(payload: RegisterIn, db: DbSession) -> TokenResponse:
    user = await auth_service.register_user(
        db, name=payload.name, email=payload.email, password=payload.password
    )
    if user is None:
        raise HTTPException(status.HTTP_409_CONFLICT, "Email already registered")
    return _token_response(user)


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginIn, db: DbSession) -> TokenResponse:
    user, reason = await auth_service.authenticate(db, payload.email, payload.password)
    if reason == "inactive":
        raise HTTPException(
            status.HTTP_403_FORBIDDEN, "Account is deactivated. Contact support."
        )
    if user is None:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")
    return _token_response(user)


@router.get("/me", response_model=UserOut)
async def me(user: CurrentUser) -> UserOut:
    return UserOut.model_validate(user)
