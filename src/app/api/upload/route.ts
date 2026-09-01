import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  isS3Configured,
  putObject,
  presignGet,
  s3PublicUrl,
  PHOTO_MIME,
  PHOTO_MAX_BYTES,
} from "@/lib/s3";

export const runtime = "nodejs";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

/**
 * POST /api/upload — gift-photo personalization.
 * Accepts multipart/form-data with a single `file` field (jpeg/png/webp ≤ 5 MB),
 * stores it in the configured S3-compatible bucket under `gift-photos/<yyyy-mm>/`,
 * and returns:
 *   - url:      presigned GET (works on private buckets, expires in 7 days)
 *   - canonical: permanent path-style URL (works once the bucket is public)
 */
export async function POST(req: NextRequest) {
  if (!isS3Configured()) {
    return NextResponse.json(
      { error: "Photo uploads are not configured (missing S3_* environment variables)." },
      { status: 503 }
    );
  }

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided." }, { status: 400 });
    }
    if (!PHOTO_MIME.includes(file.type as (typeof PHOTO_MIME)[number])) {
      return NextResponse.json(
        { error: "Only JPG, PNG or WebP images are allowed." },
        { status: 415 }
      );
    }
    if (file.size > PHOTO_MAX_BYTES) {
      return NextResponse.json(
        { error: "Image is too large — please keep it under 5 MB." },
        { status: 413 }
      );
    }

    const ext = EXT_BY_MIME[file.type] ?? "jpg";
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const key = `gift-photos/${month}/${randomUUID()}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());
    await putObject(key, buffer, file.type);

    const [url, canonical] = await Promise.all([presignGet(key), Promise.resolve(s3PublicUrl(key))]);

    return NextResponse.json({
      key,
      url,
      canonical,
      size: buffer.byteLength,
      contentType: file.type,
      expiresInDays: 7,
    });
  } catch (error) {
    console.error("POST /api/upload failed", error);
    return NextResponse.json(
      { error: "Upload failed — please try again." },
      { status: 500 }
    );
  }
}
