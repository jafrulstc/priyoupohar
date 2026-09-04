"""Shared app-level Literals + types — DB columns are plain String, values enforced here."""

import re
from typing import Annotated, Literal

from pydantic import AfterValidator

# User roles (bb_auth.users.role).
ROLES = Literal["admin", "customer"]

# Order lifecycle statuses (orders.orders.status).
ORDER_STATUSES = Literal[
    "pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"
]

# NOTE: pydantic EmailStr rejects special-use TLDs like `.test`
# (admin@bloombliss.test is the contracted admin credential!), so we validate
# with a pragmatic RFC-style regex instead of email-validator.
_EMAIL_RE = re.compile(r"^[A-Za-z0-9._%+\-']+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}$")


def _validate_email(value: str) -> str:
    cleaned = value.strip().lower()
    if not _EMAIL_RE.fullmatch(cleaned):
        raise ValueError("value is not a valid email address")
    return cleaned


EmailStrT = Annotated[str, AfterValidator(_validate_email)]
