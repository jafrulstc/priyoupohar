"""Auth business logic (repository + service)."""

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import User
from app.models.timestamps import utc_now
from app.utils.security import hash_password, verify_password

AuthResult = tuple[User | None, str]  # (user, "ok" | "invalid" | "inactive")


async def get_by_email(db: AsyncSession, email: str) -> User | None:
    return await db.scalar(select(User).where(User.email == email.lower()))


async def get_by_id(db: AsyncSession, user_id: int) -> User | None:
    return await db.get(User, user_id)


async def email_exists(db: AsyncSession, email: str) -> bool:
    return await db.scalar(select(User.id).where(User.email == email.lower())) is not None


async def register_user(db: AsyncSession, name: str, email: str, password: str) -> User | None:
    """Create a customer account; None signals a duplicate email (409)."""
    if await email_exists(db, email):
        return None
    user = User(
        name=name.strip(),
        email=email.lower(),
        password_hash=hash_password(password),
        role="customer",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def authenticate(db: AsyncSession, email: str, password: str) -> AuthResult:
    """Verify credentials; updates last_login_at on success."""
    user = await get_by_email(db, email)
    if user is None or not verify_password(password, user.password_hash):
        return None, "invalid"
    if not user.is_active:
        return None, "inactive"
    user.last_login_at = utc_now()
    await db.commit()
    await db.refresh(user)
    return user, "ok"
