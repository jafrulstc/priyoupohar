import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { resolveCoupon, couponDiscount } from "@/lib/coupons";

import { FASTAPI_URL } from "@/lib/config";

let _settingsCache: { threshold: number; fee: number; at: number } | null = null;

async function fetchSettings() {
  if (_settingsCache && Date.now() - _settingsCache.at < 60_000) return _settingsCache;
  try {
    const res = await fetch(`${FASTAPI_URL}/api/store/settings`, { cache: "no-store" });
    if (res.ok) {
      const s = await res.json();
      _settingsCache = { threshold: s.free_delivery_threshold ?? 999, fee: s.delivery_fee ?? 99, at: Date.now() };
      return _settingsCache;
    }
  } catch { /* fallback */ }
  return { threshold: 999, fee: 99, at: 0 };
}

/** POST the mapped checkout payload to FastAPI; returns the order_number. */
async function persistOrderToFastApi(
  payload: {
    items: { product_id: number; quantity: number }[];
    city: string;
    pincode: string;
    discount: number;
    extra_fees: number;
    notes: string;
  },
  authHeader?: string | null
): Promise<string | null> {
  try {
    const res = await fetch(`${FASTAPI_URL}/api/store/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });
    if (!res.ok) {
      console.error("FastAPI order persist failed", res.status, await res.text());
      return null;
    }
    const body = (await res.json()) as { order?: { order_number?: string } };
    return body.order?.order_number ?? null;
  } catch (error) {
    console.error("FastAPI order persist unreachable", error);
    return null;
  }
}

const checkoutSchema = z.object({
  items: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        price: z.number().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1),
  location: z.object({
    city: z.string(),
    pincode: z.string().optional(),
  }),
  slot: z.enum(["same-day", "midnight", "standard", "fixed"]).default("same-day"),
  /** Concrete delivery window chosen from the /api/slots availability engine. */
  slotDetail: z
    .object({
      label: z.string().max(60),
      dateISO: z.string().max(40),
    })
    .optional(),
  message: z.string().max(280).optional(),
  /** Photo personalization — URL of the image uploaded via /api/upload. */
  photoUrl: z.string().max(2048).optional(),
  coupon: z.string().max(24).optional(),
  /** Optional ₹49 premium velvet wrap — basic wrap + message card are always free. */
  premiumWrap: z.boolean().default(false),
  /** Card designer choices — only meaningful when a message is present. */
  cardDesign: z
    .object({
      washi: z.enum(["rose", "gold", "mint", "lilac"]),
      seal: z.enum(["rose", "gold", "charcoal"]),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout payload", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, location, slot, slotDetail, message, photoUrl, coupon, premiumWrap, cardDesign } =
      parsed.data;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const settings = await fetchSettings();
    const matched = resolveCoupon(coupon);
    const couponCode = matched?.code ?? null;
    const discount = matched ? couponDiscount(matched, subtotal) : 0;
    const freeShipping = matched?.kind === "shipping" || subtotal >= settings.threshold;
    const deliveryFee = freeShipping ? 0 : settings.fee;
    const giftWrap = premiumWrap ? 49 : 0;
    const total = subtotal + deliveryFee + giftWrap - discount;
    const fallbackOrderId = `BB${Date.now().toString(36).toUpperCase()}`;

    // Persist the order in the FastAPI backend (source of truth for admin).
    // Prices/stock are re-validated server-side; falls back to a synthetic id
    // if the backend is briefly unreachable so checkout never hard-fails.
    const orderId = await persistOrderToFastApi(
      {
        items: items.map((i) => ({ product_id: Number(i.id), quantity: i.qty })),
        city: location.city,
        pincode: location.pincode ?? "000000",
        discount,
        extra_fees: giftWrap,
      notes: [
        slotDetail ? `slot: ${slotDetail.label} (${slotDetail.dateISO})` : `slot: ${slot}`,
        message ? `message: ${message}` : null,
        couponCode ? `coupon: ${couponCode}` : null,
        premiumWrap ? "premium velvet wrap" : null,
        photoUrl ? `photo: ${photoUrl}` : null,
        cardDesign ? `card: washi=${cardDesign.washi} seal=${cardDesign.seal}` : null,
      ]
        .filter(Boolean)
        .join(" | ")
        .slice(0, 2000),
      },
      req.headers.get("authorization")
    );

    // Simulated payment + ETA logic
    const etaHours = slot === "midnight" ? 12 : slot === "same-day" ? 4 : 48;
    return NextResponse.json({
      orderId: orderId ?? fallbackOrderId,
      status: "confirmed",
      subtotal,
      deliveryFee,
      giftWrap,
      premiumWrap,
      coupon: couponCode,
      discount,
      freeShipping,
      total,
      etaHours,
      slot,
      slotDetail: slotDetail ?? null,
      deliveryTo: location.city,
      giftMessage: message ?? null,
      photoUrl: photoUrl ?? null,
      cardDesign: cardDesign ?? null,
      estimatedDelivery: new Date(Date.now() + etaHours * 3600_000).toISOString(),
    });
  } catch (error) {
    console.error("POST /api/checkout failed", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
