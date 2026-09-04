import { NextRequest } from "next/server";

/**
 * Media proxy — product images uploaded through the admin.
 *
 * Upload URLs stored in the DB are origin-relative ("/api/media/<key>"), so
 * the browser resolves them against the site origin and lands HERE. The
 * FastAPI backend (port 8000) is the single media authority: it serves the
 * local fallback store and streams S3/R2 objects (private buckets included)
 * using the configured credentials. We simply pipe its response through with
 * long-lived immutable caching (keys are content-addressed UUIDs).
 */

import { FASTAPI_URL } from "@/lib/config";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ key: string[] }> }) {
  const { key: segments } = await ctx.params;
  const key = segments.map(encodeURIComponent).join("/");

  if (!key || key.includes("..")) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const upstream = await fetch(`${FASTAPI_URL}/api/media/${key}`, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
    }
    return new Response(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Media service unavailable", { status: 502 });
  }
}
