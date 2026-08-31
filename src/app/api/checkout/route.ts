import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

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
  message: z.string().max(280).optional(),
  coupon: z.string().max(24).optional(),
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

    const { items, location, slot, message, coupon } = parsed.data;
    const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0);
    const deliveryFee = subtotal >= 999 ? 0 : 99;
    const giftWrap = 49;
    const couponCode = (coupon ?? "").toUpperCase() === "BLISS10" ? "BLISS10" : null;
    const discount = couponCode ? Math.round(subtotal * 0.1) : 0;
    const total = subtotal + deliveryFee + giftWrap - discount;
    const orderId = `BB${Date.now().toString(36).toUpperCase()}`;

    // Simulated payment + ETA logic
    const etaHours = slot === "midnight" ? 12 : slot === "same-day" ? 4 : 48;

    return NextResponse.json({
      orderId,
      status: "confirmed",
      subtotal,
      deliveryFee,
      giftWrap,
      coupon: couponCode,
      discount,
      total,
      etaHours,
      slot,
      deliveryTo: location.city,
      giftMessage: message ?? null,
      estimatedDelivery: new Date(Date.now() + etaHours * 3600_000).toISOString(),
    });
  } catch (error) {
    console.error("POST /api/checkout failed", error);
    return NextResponse.json({ error: "Checkout failed" }, { status: 500 });
  }
}
