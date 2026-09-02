"""S3-compatible (Filebase) image upload service — boto3, sync (runs in threadpool)."""

import os
import uuid

import boto3
from botocore.config import Config
from botocore.exceptions import BotoCoreError, ClientError

from app.core.config import settings

ALLOWED_EXTENSIONS: frozenset[str] = frozenset({".jpg", ".jpeg", ".png", ".webp"})
MAX_SIZE_BYTES = 8 * 1024 * 1024  # 8 MB
PRESIGN_SECONDS = 7 * 24 * 3600  # 7 days

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


def _client():
    return boto3.client(
        "s3",
        endpoint_url=settings.s3_endpoint,
        region_name=settings.s3_region,
        aws_access_key_id=settings.s3_access_key_id,
        aws_secret_access_key=settings.s3_secret_access_key,
        config=Config(
            signature_version="s3v4",
            s3={"addressing_style": "path"},  # path-style for Filebase
            retries={"max_attempts": 2},
        ),
    )


def _ensure_bucket(client, bucket: str) -> str:
    """Ensure the bucket exists; return the bucket name actually used.

    Falls back to the first existing account bucket when creation is
    impossible (e.g. Filebase TooManyBuckets).
    """
    try:
        client.head_bucket(Bucket=bucket)
        return bucket
    except ClientError:
        pass
    try:
        client.create_bucket(Bucket=bucket)
        return bucket
    except ClientError as exc:
        code = exc.response.get("Error", {}).get("Code", "")
        if code == "BucketAlreadyOwnedByYou":
            return bucket
        if code == "TooManyBuckets":
            owned = client.list_buckets().get("Buckets", [])
            if owned:
                return str(owned[0]["Name"])
        raise


def upload_image(filename: str, content: bytes) -> dict[str, str]:
    """Validate + store the object; returns {url, preview_url}.

    Raises UploadError(415/413/502) per the API contract.
    """
    ext = os.path.splitext(filename or "")[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadError(
            415, f"Unsupported file type '{ext or 'unknown'}'. Allowed: jpg, jpeg, png, webp"
        )
    if len(content) > MAX_SIZE_BYTES:
        raise UploadError(413, "File too large (max 8 MB)")

    bucket = settings.s3_bucket
    key = f"products/{uuid.uuid4().hex}{ext}"
    try:
        client = _client()
        bucket = _ensure_bucket(client, bucket)
        client.put_object(
            Bucket=bucket,
            Key=key,
            Body=content,
            ContentType=_CONTENT_TYPES[ext],
            ACL="public-read",
        )
        preview_url = client.generate_presigned_url(
            "get_object",
            Params={"Bucket": bucket, "Key": key},
            ExpiresIn=PRESIGN_SECONDS,
        )
    except (ClientError, BotoCoreError) as exc:
        code = ""
        if isinstance(exc, ClientError):
            code = exc.response.get("Error", {}).get("Code", "")
        raise UploadError(502, f"Storage upload failed ({code or type(exc).__name__})") from exc

    url = f"{settings.s3_endpoint.rstrip('/')}/{bucket}/{key}"
    return {"url": url, "preview_url": preview_url}
