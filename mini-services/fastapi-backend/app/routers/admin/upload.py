"""Admin media upload. POST /api/admin/upload (multipart).

The boto3 calls are blocking; upload_image() is invoked from a sync ``def``
wrapper so FastAPI runs it in the threadpool and the event loop stays free.
"""

from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status
from starlette.concurrency import run_in_threadpool

from app.services import upload_service
from app.utils.deps import AdminUser

router = APIRouter(tags=["admin-upload"])


@router.post("/upload")
async def upload_image(
    _admin: AdminUser,
    file: Annotated[UploadFile, File(description="Product image (jpg/png/webp, ≤ 8 MB)")],
) -> dict:
    content = await file.read()
    if not content:
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Empty file")
    try:
        result = await run_in_threadpool(
            upload_service.upload_image, file.filename or "", content
        )
    except upload_service.UploadError as exc:
        raise HTTPException(exc.status_code, exc.detail) from None
    return {
        "url": result["url"],
        "preview_url": result["preview_url"],
        "filename": file.filename,
        "size": len(content),
        "storage": result.get("storage", "local"),
    }
