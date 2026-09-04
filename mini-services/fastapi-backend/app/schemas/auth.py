"""Auth request/response schemas."""

from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.schemas.common import EmailStrT
from app.schemas.user import UserOut


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStrT
    password: str = Field(min_length=8, max_length=128)


class LoginIn(BaseModel):
    email: EmailStrT
    password: str = Field(min_length=1, max_length=128)


class TokenResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    access_token: str
    token_type: Literal["bearer"] = "bearer"
    user: UserOut


class UserUpdateIn(BaseModel):
    """Admin partial user update."""

    role: Literal["admin", "customer"] | None = None
    is_active: bool | None = None
