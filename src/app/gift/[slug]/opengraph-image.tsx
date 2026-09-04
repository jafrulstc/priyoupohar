import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import path from "path";
import {
  fetchFastApi,
  mapProduct,
  type FastApiProduct,
  type LegacyProduct,
} from "@/lib/product-map";

export const alt = "PriyoUpohar — fresh flowers, cakes & personalised gifts";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function getProduct(slug: string): Promise<LegacyProduct | null> {
  const body = await fetchFastApi<{ items: FastApiProduct[] }>(
    `/api/store/products?slug=${encodeURIComponent(slug)}&limit=1`
  );
  const item = body?.items?.[0];
  return item ? mapProduct(item) : null;
}

async function toDataUri(imagePath: string | null) {
  if (!imagePath) return null;
  try {
    const buf = await readFile(path.join(process.cwd(), "public", imagePath));
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function OgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  const photo = await toDataUri(product?.image ?? null);

  const off =
    product && product.mrp > product.price
      ? Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100))
      : 0;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          backgroundColor: "#171412",
          backgroundImage:
            "radial-gradient(circle at 20% 15%, rgba(225,29,72,0.55) 0%, rgba(23,20,18,0) 45%), radial-gradient(circle at 85% 90%, rgba(245,158,11,0.4) 0%, rgba(23,20,18,0) 50%)",
          padding: "56px 64px",
          color: "#fafaf9",
        }}
      >
        {/* photo panel */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 470,
            height: 470,
            borderRadius: 36,
            backgroundColor: "#fafaf9",
            padding: 14,
            transform: "rotate(-2deg)",
            marginRight: 56,
            flexShrink: 0,
          }}
        >
          {photo ? (
            <img
              src={photo}
              alt={product?.name ?? "gift"}
              width={442}
              height={442}
              style={{ borderRadius: 26, objectFit: "cover" }}
            />
          ) : (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                height: "100%",
                borderRadius: 26,
                backgroundColor: "#fff1f2",
                fontSize: 120,
                fontWeight: 800,
                color: "#e11d48",
              }}
            >
              B
            </div>
          )}
        </div>

        {/* copy panel */}
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: "#e11d48",
                fontSize: 24,
                fontWeight: 800,
                color: "#fafaf9",
              }}
            >
              B
            </div>
            <div style={{ display: "flex", fontSize: 26, fontWeight: 700, letterSpacing: 1 }}>
              PriyoUpohar
            </div>
          </div>

          <div
            style={{
              display: "flex",
              fontSize: product ? 58 : 48,
              fontWeight: 800,
              lineHeight: 1.12,
              marginTop: 30,
              overflow: "hidden",
            }}
          >
            {product ? product.name : "Gifts that make hearts bloom"}
          </div>

          {product && (
            <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 34 }}>
              <div style={{ display: "flex", fontSize: 52, fontWeight: 800, color: "#fbbf24" }}>
                Rs.{Math.round(product.price)}
              </div>
              {off > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    fontSize: 26,
                    fontWeight: 700,
                    color: "#a8a29e",
                    textDecoration: "line-through",
                  }}
                >
                  Rs.{Math.round(product.mrp)}
                </div>
              )}
              {off > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 24,
                    fontWeight: 800,
                    color: "#10b981",
                    backgroundColor: "rgba(16,185,129,0.16)",
                    borderRadius: 999,
                    padding: "6px 18px",
                  }}
                >
                  {off}% OFF
                </div>
              )}
            </div>
          )}

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: product ? 40 : 44,
              fontSize: 25,
              fontWeight: 600,
              color: "#d6d3d1",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                backgroundColor: "rgba(225,29,72,0.28)",
                borderRadius: 999,
                padding: "8px 22px",
                color: "#fda4af",
                fontWeight: 700,
              }}
            >
              Same-day delivery
            </div>
            <div>· 400+ cities · Free gift wrap</div>
          </div>

          <div
            style={{
              display: "flex",
              marginTop: 30,
              fontSize: 22,
              fontWeight: 600,
              color: "#a8a29e",
            }}
          >
            {product && product.rating
              ? `${product.rating.toFixed(1)} rating · ${product.reviews.toLocaleString("en-IN")} happy reviews`
              : "Hand-delivered with love, same day"}
          </div>
        </div>
      </div>
    ),
    size
  );
}
