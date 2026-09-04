/**
 * Shared deterministic serviceability engine for Indian pincodes.
 * Used by /api/pincode (serviceability verdict) and /api/slots (delivery windows)
 * so both endpoints always agree for the same pincode.
 */

export const ZONES: Record<
  string,
  { state: string; metro: string[]; tier: 1 | 2 }
> = {
  "1": { state: "Dhaka Division", metro: ["Dhaka", "Gazipur", "Narayanganj"], tier: 1 },
  "2": { state: "Mymensingh Division", metro: ["Mymensingh", "Jamalpur"], tier: 2 },
  "3": { state: "Sylhet Division", metro: ["Sylhet", "Moulvibazar"], tier: 1 },
  "4": { state: "Chittagong Division", metro: ["Chittagong", "Comilla", "Cox's Bazar"], tier: 1 },
  "5": { state: "Rajshahi Division", metro: ["Rajshahi", "Bogra", "Pabna"], tier: 1 },
  "6": { state: "Rangpur Division", metro: ["Rangpur", "Dinajpur"], tier: 2 },
  "7": { state: "Khulna Division", metro: ["Khulna", "Jessore", "Kushtia"], tier: 1 },
  "8": { state: "Barisal Division", metro: ["Barisal", "Patuakhali"], tier: 2 },
  "9": { state: "Dhaka Suburbs", metro: ["Savar", "Keraniganj"], tier: 2 },
};

/** Well-known 2-digit prefixes → their iconic city (beats a random metro pick). */
export const CITY_PREFIX: Record<string, string> = {
  "10": "Dhaka",
  "11": "Dhaka",
  "12": "Dhaka",
  "13": "Dhaka",
  "14": "Narayanganj",
  "17": "Gazipur",
  "22": "Mymensingh",
  "31": "Sylhet",
  "40": "Chittagong",
  "41": "Chittagong",
  "42": "Chittagong",
  "43": "Chittagong",
  "35": "Comilla",
  "60": "Rajshahi",
  "58": "Bogra",
  "54": "Rangpur",
  "90": "Khulna",
  "91": "Khulna",
  "92": "Khulna",
  "82": "Barisal",
};

export const isValidPincode = (code: string) => /^\d{4}$/.test(code);

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

/** Full serviceability verdict for a valid 4-digit pincode. */
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
  const city = CITY_PREFIX[code.slice(0, 2)] ?? zone.metro[hash % zone.metro.length];
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
