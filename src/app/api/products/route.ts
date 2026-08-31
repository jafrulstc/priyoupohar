import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const limit = Number(searchParams.get("limit") ?? 40);
    const query = searchParams.get("q");
    const slug = searchParams.get("slug");

    const where: Record<string, unknown> = {};
    if (slug) where.slug = slug;
    if (category && category !== "all") where.category = category;
    if (query) {
      where.OR = [
        { name: { contains: query } },
        { description: { contains: query } },
      ];
    }

    const products = await db.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { rating: "desc" }],
      take: Number.isFinite(limit) ? limit : 40,
    });

    return NextResponse.json({ products });
  } catch (error) {
    console.error("GET /api/products failed", error);
    return NextResponse.json(
      { error: "Failed to load products" },
      { status: 500 }
    );
  }
}
