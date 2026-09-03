"""Image upload service — resilient S3-compatible storage chain.

Order per upload (first success wins):
1. Cloudflare R2   (settings.s3_*            — bucket "priyoupohar")
2. Filebase        (settings.s3_fallback_*   — bucket "priyoupohar")
3. Local disk      (settings.media_dir)      — always succeeds

Every S3 target is optional: targets with empty credentials are skipped.
R2/Filebase do NOT support ACLs, so ``put_object`` is sent without one.
After a successful PUT we probe the canonical URL WITHOUT auth; when the
bucket is publicly readable we return the direct URL, otherwise the object
is served through the authenticated backend proxy ``GET /api/media/{key}``
(which streams private objects using the same credentials) so stored URLs
never expire.

The boto3 + urllib calls are blocking; the admin router runs them in the
FastAPI threadpool.
"""

import logging
import os
import urllib.error
import urllib.request
import uuid
from pathlib import Path

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

logger = logging.getLogger("bb.upload")

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".jpg", ".jpeg", ".png", ".webp"})
MAX_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
_PUBLIC_PROBE_TIMEOUT = 4  # seconds

_CONTENT_TYPES = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp",
}


class UploadError(Exception):
    def __init__(self, status_code: int, detail: str) -> None:
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail


def _s3_configured() -> bool:
    """True when at least one S3 target (primary or fallback) is usable."""
    return len(s3_targets()) > 0


def _client(endpoint: str, region: str, ak: str, sk: str):
    return boto3.client(
        "s3",
        endpoint_url=endpoint,
        region_name=region,
        aws_access_key_id=ak,
        aws_secret_access_key=sk,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},  # path-style: R2 + Filebase both OK
            retries={"max_attempts": 2},
        ),
    )


def s3_targets() -> list[dict]:
    """All configured S3 targets in try-order: R2 primary, Filebase fallback."""
    targets: list[dict] = []
    if settings.s3_endpoint and settings.s3_access_key_id and settings.s3_secret_access_key:
        targets.append(
            {
                "name": "r2",
                "client": _client(
                    settings.s3_endpoint,
                    settings.s3_region,
                    settings.s3_access_key_id,
                    settings.s3_secret_access_key,
                ),
                "bucket": settings.s3_bucket,
                "endpoint": settings.s3_endpoint,
            }
        )
    if (
        settings.s3_fallback_endpoint
        and settings.s3_fallback_access_key_id
        and settings.s3_fallback_secret_access_key
    ):
        targets.append(
            {
                "name": "filebase",
                "client": _client(
                    settings.s3_fallback_endpoint,
                    settings.s3_fallback_region,
                    settings.s3_fallback_access_key_id,
                    settings.s3_fallback_secret_access_key,
                ),
                "bucket": settings.s3_fallback_bucket,
                "endpoint": settings.s3_fallback_endpoint,
            }
        )
    return targets


def media_dir() -> Path:
    path = Path(settings.media_dir)
    path.mkdir(parents=True, exist_ok=True)
    return path


def _save_local(key: str, content: bytes) -> None:
    target = media_dir() / key
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(content)


def _url_is_public(url: str) -> bool:
    try:
        req = urllib.request.Request(url, method="GET")
        with urllib.request.urlopen(req, timeout=_PUBLIC_PROBE_TIMEOUT) as resp:
            return resp.status == 200
    except (urllib.error.URLError, OSError, ValueError):
        return False


def _put_s3(target: dict, key: str, content: bytes, content_type: str) -> str:
    """Upload to one S3 target; return the best public-facing URL.

    Raises on failure so the caller can try the next target.
    """
    client = target["client"]
    bucket = target["bucket"]
    try:
        client.put_object(Bucket=bucket, Key=key, Body=content, ContentType=content_type)
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code == "NoSuchBucket":
            client.create_bucket(Bucket=bucket)
            client.put_object(Bucket=bucket, Key=key, Body=content, ContentType=content_type)
        else:
            raise

    canonical = f"{target['endpoint'].rstrip('/')}/{bucket}/{key}"
    if _url_is_public(canonical):
        return canonical
    # Private bucket — serve through the authenticated backend proxy instead
    # of a presigned URL that would expire from the DB after 7 days.
    return f"/api/media/{key}"


def upload_image(filename: str, content: bytes) -> dict[str, str]:
    """Validate + store the object; returns {url, preview_url, storage}.

    Raises UploadError(415/413) per the API contract.
    """
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadError(
            415, f"Unsupported file type '{ext or 'unknown'}'. Allowed: jpg, jpeg, png, webp"
        )
    if len(content) > MAX_SIZE_BYTES:
        raise UploadError(413, "File too large (max 8 MB)")

    key = f"products/{uuid.uuid4().hex}{ext}"
    content_type = _CONTENT_TYPES[ext]

    for target in s3_targets():
        try:
            url = _put_s3(target, key, content, content_type)
            logger.info("Uploaded %s to %s (%s)", key, target["name"], target["endpoint"])
            return {"url": url, "preview_url": url, "storage": target["name"]}
        except (ClientError, BotoCoreError) as exc:
            code = ""
            if isinstance(exc, ClientError):
                code = exc.response.get("Error", {}).get("Code", "")
            logger.warning(
                "S3 upload to %s failed for %s (%s) — trying next target",
                target["name"],
                key,
                code or type(exc).__name__,
            )

    _save_local(key, content)
    url = f"/api/media/{key}"
    return {"url": url, "preview_url": url, "storage": "local"}
