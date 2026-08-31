import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/pincode?code=400001
 *
 * Deterministic (pseudo) serviceability engine for Indian pincodes:
 *  - validates the 6-digit format
 *  - maps the leading digit to a postal zone + representative state
 *  - derives a STABLE serviceability/ETA/COD verdict via a simple hash,
 *    so the same pincode always yields the same answer (no random flicker).
 */

const ZONES: Record<string, { state: string; metro: string[]; tier: 1 | 2 }> = {
  "1": { state: "Delhi / Haryana / Punjab", metro: ["New Delhi", "Gurugram", "Noida"], tier: 1 },
  "2": { state: "Uttar Pradesh / Uttarakhand", metro: ["Lucknow", "Kanpur", "Dehradun"], tier: 2 },
  "3": { state: "Rajasthan / Gujarat", metro: ["Jaipur", "Ahmedabad", "Surat"], tier: 1 },
  "4": { state: "Maharashtra / Goa / Madhya Pradesh", metro: ["Mumbai", "Pune", "Nagpur"], tier: 1 },
  "5": { state: "Telangana / Andhra Pradesh / Karnataka", metro: ["Hyderabad", "Bengaluru"], tier: 1 },
  "6": { state: "Tamil Nadu / Kerala", metro: ["Chennai", "Kochi", "Coimbatore"], tier: 1 },
  "7": { state: "West Bengal / Odisha / North-East", metro: ["Kolkata", "Guwahati"], tier: 2 },
  "8": { state: "Bihar / Jharkhand / Chhattisgarh", metro: ["Patna", "Ranchi"], tier: 2 },
};

/** Well-known 3-digit prefixes → their iconic city (beats a random metro pick). */
const CITY_PREFIX: Record<string, string> = {
  "110": "New Delhi",
  "400": "Mumbai",
  "411": "Pune",
  "440": "Nagpur",
  "560": "Bengaluru",
  "500": "Hyderabad",
  "600": "Chennai",
  "700": "Kolkata",
  "380": "Ahmedabad",
  "302": "Jaipur",
  "226": "Lucknow",
  "682": "Kochi",
};

export async function GET(req: NextRequest) {
  const code = (req.nextUrl.searchParams.get("code") ?? "").trim();

  if (!/^\d{6}$/.test(code)) {
    return NextResponse.json(
      { error: "Enter a valid 6-digit Indian pincode." },
      { status: 400 }
    );
  }

  const zone = ZONES[code[0]] ?? null;

  // Stable hash — same pincode → same verdict, every time.
  const digits = code.split("").map(Number);
  const hash = digits.reduce((s, d, i) => s + d * (i + 3), 0);

  // ~85% of pincodes serviceable; the rest are "outside our direct network".
  const serviceable = hash % 7 !== 3;

  if (!zone) {
    return NextResponse.json(
      { pincode: code, serviceable: false, reason: "Army/APS postal code" },
      { status: 200 }
    );
  }

  if (!serviceable) {
    return NextResponse.json({
      pincode: code,
      serviceable: false,
      state: zone.state,
      nearestHub: CITY_PREFIX[code.slice(0, 3)] ?? zone.metro[hash % zone.metro.length],
      notifyAvailable: true,
    });
  }

  const metro = zone.tier === 1;
  const sameDay = metro && hash % 10 !== 9; // metros mostly same-day
  const etaHours = sameDay ? 4 : metro ? 12 : 24 + (hash % 2) * 12; // 4 / 12 / 24-36
  const midnightAvailable = metro && hash % 5 !== 4;
  const codAvailable = hash % 4 !== 2;

  // Server-side ETA truth; client renders relative labels.
  const eta = new Date(Date.now() + etaHours * 3600_000);

  return NextResponse.json({
    pincode: code,
    serviceable: true,
    city: CITY_PREFIX[code.slice(0, 3)] ?? zone.metro[hash % zone.metro.length],
    state: zone.state,
    sameDay,
    midnightAvailable,
    codAvailable,
    etaHours,
    etaLabel: sameDay
      ? "Today by 9 PM"
      : etaHours <= 12
        ? "Tomorrow morning"
        : `In ${etaHours / 24 === 1 ? "1 day" : `${etaHours / 24} days`}`,
    etaAt: eta.toISOString(),
    freeShippingEligible: true,
  });
}
