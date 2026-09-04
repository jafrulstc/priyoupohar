/**
 * Public Cloudflare R2 CDN base for the media bucket "priyoupohar".
 *
 * The bucket allows public reads through its r2.dev domain, so product
 * imagery loads straight from Cloudflare's edge network — no round-trip
 * through the Next.js media proxy or the FastAPI backend. The proxy chain
 * (`/api/media/...`) is kept only as a fallback for local-disk uploads.
 */
export const R2_PUBLIC_BASE =
  "https://pub-e04790e99b0d41109ffc73b5345f35cd.r2.dev";

/** Build a direct CDN URL for a media object key (e.g. "products/roses.jpg"). */
export function r2Url(key: string): string {
  return `${R2_PUBLIC_BASE}/${key.replace(/^\/+/, "")}`;
}

/** Direct CDN URL for a product image file under the "products/" namespace. */
export function r2ProductUrl(file: string): string {
  return r2Url(`products/${file.replace(/^products\//, "").replace(/^\/+/, "")}`);
}

/**
 * Resolve a stored media reference for display.
 *
 * The DB (and the FastAPI API responses) keep origin-relative proxy paths
 * ("/api/media/<key>") so stored URLs survive bucket/domain changes. When
 * the bucket's public CDN is available we rewrite those to direct Cloudflare
 * URLs at render time; absolute URLs and app-local paths pass through
 * untouched, and with no CDN configured the proxy path is used as-is
 * (graceful fallback to the old proxy chain).
 */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (!path) return "";
  if (path.startsWith("/api/media/")) {
    return r2Url(path.slice("/api/media/".length));
  }
  return path;
}
