"""Public media proxy. GET /api/media/{key:path}

Serves uploaded objects:
1. Local fallback store first (``settings.media_dir``).
2. Otherwise streams straight from the S3/R2 bucket using the configured
   credentials (works for PRIVATE buckets — no public ACL needed).

No auth: product images are public by nature. Keys are validated against a
strict pattern and path-traversal is impossible (resolve + prefix check).
"""

import re
from mimetypes import guess_type
from pathlib import Path

from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse, StreamingResponse

from app.services import upload_service

router = APIRouter(tags=["media"])

_KEY_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9/_.\-]{0,300}$")

_CACHE = "public, max-age=31536000, immutable"


def _validate(key: str) -> str:
    if not key or not _KEY_RE.match(key) or ".." in key:
        raise HTTPException(404, "Not found")
    return key


def _local_path(key: str) -> Path | None:
    root = upload_service.media_dir().resolve()
    candidate = (root / key).resolve()
    if not str(candidate).startswith(str(root)):
        return None
    return candidate if candidate.is_file() else None


def _s3_stream(key: str, content_type: str):
    """Stream from the first S3 target that has the object (R2 → Filebase)."""
    last_error: Exception | None = None
    for target in upload_service.s3_targets():
        try:
            obj = target["client"].get_object(Bucket=target["bucket"], Key=key)
            return StreamingResponse(
                obj["Body"].iter_chunks(64 * 1024),
                media_type=content_type,
                headers={"Cache-Control": _CACHE},
            )
        except Exception as exc:  # noqa: BLE001 — try the next target
            last_error = exc
    if last_error is not None:
        raise last_error
    raise LookupError(key)


@router.get("/api/media/{key:path}")
async def get_media(key: str):
    key = _validate(key)

    local = _local_path(key)
    if local is not None:
        media_type = guess_type(str(local))[0] or "application/octet-stream"
        return FileResponse(
            local,
            media_type=media_type,
            headers={"Cache-Control": _CACHE},
        )

    if upload_service._s3_configured():
        media_type = guess_type(key)[0] or "application/octet-stream"
        try:
            return _s3_stream(key, media_type)
        except Exception:  # noqa: BLE001 — fall through to 404
            pass

    raise HTTPException(404, "Not found")
