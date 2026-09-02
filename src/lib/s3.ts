import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * S3-compatible object storage client (Filebase / AWS S3 / MinIO).
 * Used by POST /api/upload for gift-photo personalization.
 * Configure via S3_* env vars — see .env.example.
 */

const endpoint = process.env.S3_ENDPOINT;
const region = process.env.S3_REGION || "auto";
const accessKeyId = process.env.S3_ACCESS_KEY_ID;
const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
export const S3_BUCKET = process.env.S3_BUCKET ?? "";

export const isS3Configured = () =>
  Boolean(endpoint && accessKeyId && secretAccessKey && S3_BUCKET);

let client: S3Client | null = null;

export function getS3Client(): S3Client {
  if (!isS3Configured()) throw new Error("S3 storage is not configured (S3_* env vars)");
  if (!client) {
    client = new S3Client({
      region,
      endpoint,
      credentials: { accessKeyId: accessKeyId!, secretAccessKey: secretAccessKey! },
    });
  }
  return client;
}

/** Permanent path-style URL — works once the bucket allows public reads. */
export function s3PublicUrl(key: string): string {
  return `${process.env.S3_ENDPOINT}/${S3_BUCKET}/${key}`;
}

/** Presigned GET URL (default 7 days) — works on private buckets immediately. */
export async function presignGet(key: string, expiresIn = 7 * 24 * 3600): Promise<string> {
  return getSignedUrl(
    getS3Client(),
    new GetObjectCommand({ Bucket: S3_BUCKET, Key: key }),
    { expiresIn }
  );
}

/** Upload a buffer; tries object-level public-read ACL (harmless if unsupported). */
export async function putObject(
  key: string,
  body: Buffer,
  contentType: string
): Promise<void> {
  await getS3Client().send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: body,
      ContentType: contentType,
      ACL: "public-read",
    })
  );
}

/** Allowed upload types + size cap for gift photos. */
export const PHOTO_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const PHOTO_MAX_BYTES = 5 * 1024 * 1024;
