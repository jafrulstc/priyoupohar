/**
 * Shared deterministic serviceability engine for Indian pincodes.
 * Used by /api/pincode (serviceability verdict) and /api/slots (delivery windows)
 * so both endpoints always agree for the same pincode.
 */

export const ZONES: Record<
  string,
  { state: string; metro: string[]; tier: 1 | 2 }
> = {
  "1": { state: "Delhi / Haryana / Punjab", metro: ["New Delhi", "Gurugram", "Noida"], tier: 1 },
  "2": { state: "Uttar Pradesh / Uttarakhand", metro: ["Lucknow", "Kanpur", "Dehradun"], tier: 2 },
  "3": { state: "Rajasthan / Gujarat", metro: ["Jaipur", "Ahmedabad", "Surat"], tier: 1 },
  "4": { state: "Maharashtra / Goa / Madhya Pradesh", metro: ["Mumbai", "Pune", "Nagpur"], tier: 1 },
  "5": {
    state: "Telangana / Andhra Pradesh / Karnataka",
    metro: ["Hyderabad", "Bengaluru"],
    tier: 1,
  },
  "6": { state: "Tamil Nadu / Kerala", metro: ["Chennai", "Kochi", "Coimbatore"], tier: 1 },
  "7": { state: "West Bengal / Odisha / North-East", metro: ["Kolkata", "Guwahati"], tier: 2 },
  "8": { state: "Bihar / Jharkhand / Chhattisgarh", metro: ["Patna", "Ranchi"], tier: 2 },
};

/** Well-known 3-digit prefixes → their iconic city (beats a random metro pick). */
export const CITY_PREFIX: Record<string, string> = {
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

export const isValidPincode = (code: string) => /^\d{6}$/.test(code);

/** Stable hash — same pincode → same verdict, every time. */
export const pincodeHash = (code: string) => {
  const digits = code.split("").map(Number);
  return digits.reduce((s, d, i) => s + d * (i + 3), 0);
};

export type Serviceability = {
  serviceable: boolean;
  city: string;
  state: string;
  metro: boolean;
  sameDay: boolean;
  midnightAvailable: boolean;
  codAvailable: boolean;
  etaHours: number;
};

/** Full serviceability verdict for a valid 6-digit pincode. */
export function serviceabilityFor(code: string): Serviceability {
  const zone = ZONES[code[0]];
  const hash = pincodeHash(code);

  if (!zone) {
    return {
      serviceable: false,
      city: "—",
      state: "Army/APS postal code",
      metro: false,
      sameDay: false,
      midnightAvailable: false,
      codAvailable: false,
      etaHours: 0,
    };
  }

  // ~85% of pincodes serviceable; the rest are "outside our direct network".
  const serviceable = hash % 7 !== 3;
  const city = CITY_PREFIX[code.slice(0, 3)] ?? zone.metro[hash % zone.metro.length];
  const metro = zone.tier === 1;

  if (!serviceable) {
    return {
      serviceable: false,
      city,
      state: zone.state,
      metro,
      sameDay: false,
      midnightAvailable: false,
      codAvailable: false,
      etaHours: 0,
    };
  }

  const sameDay = metro && hash % 10 !== 9; // metros mostly same-day
  const etaHours = sameDay ? 4 : metro ? 12 : 24 + (hash % 2) * 12; // 4 / 12 / 24-36

  return {
    serviceable: true,
    city,
    state: zone.state,
    metro,
    sameDay,
    midnightAvailable: metro && hash % 5 !== 4,
    codAvailable: hash % 4 !== 2,
    etaHours,
  };
}

/** Extra deterministic salt for per-slot scarcity numbers. */
export const slotHash = (code: string, slotId: string) => {
  const base = pincodeHash(code);
  let h = base;
  for (let i = 0; i < slotId.length; i++) h = (h * 31 + slotId.charCodeAt(i)) % 9973;
  return h;
};
