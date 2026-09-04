import { NextRequest, NextResponse } from "next/server";
import { fetchProductsLegacy } from "@/lib/product-map";

/**
 * Thin proxy to the FastAPI backend (port 8000) — the single integration
 * point for every storefront component that used to read Prisma directly.
 * Response shape is identical to the legacy Prisma route: { products: [...] }.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const params = new URLSearchParams();

  const category = searchParams.get("category");
  if (category && category !== "all") params.set("category", category);
  const q = searchParams.get("q");
  if (q) params.set("q", q);
  const slug = searchParams.get("slug");
  if (slug) params.set("slug", slug);
  const slugs = searchParams.get("slugs");
  if (slugs) params.set("slugs", slugs);
  const limit = Number(searchParams.get("limit") ?? 40);
  params.set("limit", String(Number.isFinite(limit) ? Math.min(limit, 100) : 40));

  const products = await fetchProductsLegacy(params.toString());
  return NextResponse.json({ products });
}
