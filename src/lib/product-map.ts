/**
 * Adapter: FastAPI `ProductOut` (snake_case, numeric ids) → the legacy
 * Prisma-era product shape the storefront components consume.
 *
 * FastAPI (mini-services/fastapi-backend) is the source of truth for the
 * catalog; this mapper keeps every existing component working unchanged.
 * Media paths are resolved to the public R2 CDN here so every storefront
 * consumer loads images straight from Cloudflare's edge (see lib/media).
 */

import { resolveMediaUrl } from "@/lib/media";

export interface FastApiCategory {
  id: number;
  name: string;
  slug: string;
}

export interface FastApiProduct {
  id: number;
  name: string;
  slug: string;
  description: string;
  price: number;
  original_price: number | null;
  category_id: number | null;
  category: FastApiCategory | null;
  image_url: string;
  images: string[];
  rating: number;
  review_count: number;
  stock: number;
  is_featured: boolean;
  is_active: boolean;
  badge: string | null;
  same_day: boolean;
  pairs_with: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface LegacyProduct {
  id: string;
  name: string;
  slug: string;
  category: string | null;
  price: number;
  mrp: number;
  image: string;
  rating: number;
  reviews: number;
  tag: string | null;
  sameDay: boolean;
  description: string;
  pairsWith: string | null;
  stock: number;
  isFeatured: boolean;
  gallery: string[];
}

import { FASTAPI_URL } from "@/lib/config";
export { FASTAPI_URL };

export function mapProduct(p: FastApiProduct): LegacyProduct {
  return {
    id: String(p.id),
    name: p.name,
    slug: p.slug,
    category: p.category?.slug ?? null,
    price: p.price,
    mrp: p.original_price ?? p.price,
    image: resolveMediaUrl(p.image_url),
    rating: p.rating,
    reviews: p.review_count,
    tag: p.badge,
    sameDay: p.same_day,
    description: p.description,
    pairsWith: p.pairs_with,
    stock: p.stock,
    isFeatured: p.is_featured,
    gallery: (p.images ?? []).map(resolveMediaUrl),
  };
}

/** Fetch + map a FastAPI JSON body; returns null when unreachable. */
export async function fetchFastApi<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${FASTAPI_URL}${path}`, {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchProductsLegacy(
  params: string
): Promise<LegacyProduct[]> {
  const body = await fetchFastApi<{ items: FastApiProduct[] }>(
    `/api/store/products?${params}`
  );
  if (!body?.items) return [];
  return body.items.map(mapProduct);
}
