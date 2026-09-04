import { NextRequest, NextResponse } from "next/server";
import {
  CITY_PREFIX,
  isValidPincode,
  pincodeHash,
  serviceabilityFor,
} from "@/lib/serviceability";

import { FASTAPI_URL } from "@/lib/config";

type DbVerdict = {
  serviceable: boolean;
  city: string;
  state: string;
  same_day: boolean;
  midnight_available: boolean;
  cod_available: boolean;
  eta_hours: number;
  delivery_fee: number;
  free_above: number | null;
  free_delivery_threshold: number;
};

/** Task 2.2 — prefer the admin-managed DB verdict; fall back to local engine. */
async function dbServiceability(code: string): Promise<DbVerdict | null> {
  try {
    const res = await fetch(
      `${FASTAPI_URL}/api/store/locations/serviceability?pincode=${code}`,
      { cache: "no-store", signal: AbortSignal.timeout(2500) }
    );
    if (!res.ok) return null;
    return (await res.json()) as DbVerdict;
  } catch {
    return null;
  }
}

/**
 * GET /api/pincode?code=400001
 *
 * Serviceability verdict: DB-driven (admin delivery locations) when the
 * backend answers, otherwise the deterministic local engine.
 */
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();

  if (!isValidPincode(code)) {
    return NextResponse.json(
      { error: "Enter a valid 4-digit postal code." },
      { status: 400 }
    );
  }

  const db = await dbServiceability(code);
  if (db && db.serviceable) {
    const eta = new Date(Date.now() + db.eta_hours * 3600_000);
    return NextResponse.json({
      pincode: code,
      serviceable: true,
      city: db.city || CITY_PREFIX[code.slice(0, 3)] || serviceabilityFor(code).city,
      state: db.state,
      sameDay: db.same_day,
      midnightAvailable: db.midnight_available,
      codAvailable: db.cod_available,
      etaHours: db.eta_hours,
      etaLabel:
        db.same_day
          ? "Today by 9 PM"
          : db.eta_hours <= 12
            ? "Tomorrow morning"
            : `In ${db.eta_hours / 24 === 1 ? "1 day" : `${db.eta_hours / 24} days`}`,
      etaAt: eta.toISOString(),
      deliveryFee: db.delivery_fee,
      freeAbove: db.free_above,
      freeDeliveryThreshold: db.free_delivery_threshold,
      source: "db",
    });
  }

  const verdict = serviceabilityFor(code);

  if (!verdict.serviceable) {
    const zoneless = code[0] < "1" || code[0] > "8";
    return NextResponse.json({
      pincode: code,
      serviceable: false,
      ...(zoneless
        ? { reason: "Army/APS postal code" }
        : {
            state: verdict.state,
            nearestHub: CITY_PREFIX[code.slice(0, 3)] ?? verdict.city,
            notifyAvailable: true,
          }),
    });
  }

  // Server-side ETA truth; client renders relative labels.
  const eta = new Date(Date.now() + verdict.etaHours * 3600_000);

  return NextResponse.json({
    pincode: code,
    serviceable: true,
    city: verdict.city,
    state: verdict.state,
    sameDay: verdict.sameDay,
    midnightAvailable: verdict.midnightAvailable,
    codAvailable: verdict.codAvailable,
    etaHours: verdict.etaHours,
    etaLabel: verdict.sameDay
      ? "Today by 9 PM"
      : verdict.etaHours <= 12
        ? "Tomorrow morning"
        : `In ${verdict.etaHours / 24 === 1 ? "1 day" : `${verdict.etaHours / 24} days`}`,
    etaAt: eta.toISOString(),
    freeShippingEligible: true,
    source: "local",
  });
}
