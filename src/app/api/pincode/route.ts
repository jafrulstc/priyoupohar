import { NextRequest, NextResponse } from "next/server";
import {
  CITY_PREFIX,
  isValidPincode,
  pincodeHash,
  serviceabilityFor,
} from "@/lib/serviceability";

/**
 * GET /api/pincode?code=400001
 *
 * Deterministic (pseudo) serviceability engine for Indian pincodes.
 * Zone logic + verdicts live in @/lib/serviceability (shared with /api/slots).
 */
export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();

  if (!isValidPincode(code)) {
    return NextResponse.json(
      { error: "Enter a valid 6-digit Indian pincode." },
      { status: 400 }
    );
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
  });
}
