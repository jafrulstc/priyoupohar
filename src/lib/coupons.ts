/**
 * Shared coupon engine — single source of truth for the cart drawer,
 * the spin-to-win wheel prizes and the /api/checkout route.
 */

export type CouponKind = "percent" | "flat" | "shipping";

export type Coupon = {
  code: string;
  label: string;
  kind: CouponKind;
  /** percent value (0-100) or flat ₹ amount; ignored for "shipping" */
  value: number;
};

export const COUPONS: Record<string, Coupon> = {
  BLISS10: { code: "BLISS10", label: "10% off", kind: "percent", value: 10 },
  SPIN15: { code: "SPIN15", label: "15% off", kind: "percent", value: 15 },
  JOY50: { code: "JOY50", label: "₹50 off", kind: "flat", value: 50 },
  SHIPFREE: { code: "SHIPFREE", label: "Free shipping", kind: "shipping", value: 0 },
  /** Bloom Rewards loyalty unlock — every 3rd order earns this. */
  BLOOM100: { code: "BLOOM100", label: "₹100 off", kind: "flat", value: 100 },
};

export function resolveCoupon(code: string | null | undefined): Coupon | null {
  if (!code) return null;
  return COUPONS[code.trim().toUpperCase()] ?? null;
}

/** Merchandise discount a coupon yields on a given subtotal (₹0 for shipping coupons). */
export function couponDiscount(coupon: Coupon, subtotal: number): number {
  if (coupon.kind === "percent") return Math.round((subtotal * coupon.value) / 100);
  if (coupon.kind === "flat") return Math.min(coupon.value, subtotal);
  return 0;
}
