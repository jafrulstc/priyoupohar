import { NextRequest, NextResponse } from "next/server";
import { isValidPincode, serviceabilityFor, slotHash } from "@/lib/serviceability";

/**
 * GET /api/slots?code=560001
 *
 * Delivery-slot availability engine:
 *  - serviceability comes from the SAME deterministic verdict as /api/pincode
 *    (same-day/midnight availability always agree between the two endpoints)
 *  - real cutoff logic: each window disappears once its same-day cutoff has passed
 *  - deterministic scarcity ("Only 4 left") per pincode × slot, stable across reloads
 *
 * Windows (delivery-local time):
 *   morning   9 AM–12 PM   cutoff 8:00 AM
 *   afternoon 2–6 PM       cutoff 1:00 PM
 *   evening   6–9 PM       cutoff 5:30 PM
 *   midnight  11 PM–1 AM   cutoff 9:00 PM  (metro + midnightAvailable only)
 */

export type Slot = {
  id: string;
  /** Delivery calendar date (ISO yyyy-mm-dd). */
  dateISO: string;
  dayLabel: string;
  window: string;
  /** Human cutoff, e.g. "1 PM today". */
  cutoff: string;
  /** Server time (ISO) after which this slot can no longer be chosen. */
  cutoffAt: string;
  kind: "same-day" | "midnight" | "standard";
  left: number;
};

type WindowDef = {
  key: string;
  label: string;
  cutoffH: number;
  cutoffM: number;
  cutoffLabel: string;
};

const WINDOWS: WindowDef[] = [
  { key: "morning", label: "9 AM–12 PM", cutoffH: 8, cutoffM: 0, cutoffLabel: "8 AM" },
  { key: "aft", label: "2–6 PM", cutoffH: 13, cutoffM: 0, cutoffLabel: "1 PM" },
  { key: "eve", label: "6–9 PM", cutoffH: 17, cutoffM: 30, cutoffLabel: "5:30 PM" },
  { key: "mid", label: "11 PM–1 AM", cutoffH: 21, cutoffM: 0, cutoffLabel: "9 PM" },
];

const atTime = (base: Date, h: number, m = 0) => {
  const d = new Date(base);
  d.setHours(h, m, 0, 0);
  return d;
};

const dayLabelFor = (base: Date, offset: number) => {
  if (offset === 0) return "Today";
  if (offset === 1) return "Tomorrow";
  return base.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
};

const dateISOFor = (base: Date, offset: number) => {
  const d = new Date(base);
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};

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
    return NextResponse.json({
      pincode: code,
      serviceable: false,
      city: verdict.city,
      slots: [],
    });
  }

  const now = new Date();
  const slots: Slot[] = [];

  for (let offset = 0; offset < 3; offset++) {
    const dateISO = dateISOFor(now, offset);
    const dayLabel = dayLabelFor(now, offset);
    const isToday = offset === 0;
    const isTomorrow = offset === 1;

    for (const w of WINDOWS) {
      /* availability rules */
      if (w.key === "mid") {
        // Midnight is a metro privilege, tonight + tomorrow night.
        if (!verdict.midnightAvailable) continue;
        if (offset > 1) continue;
      } else if (isToday && !verdict.sameDay) {
        // No today windows when same-day isn't available for this pincode.
        continue;
      }

      /* real cutoff: the slot vanishes once its cutoff passes */
      const cutoffAt = atTime(now, w.cutoffH, w.cutoffM);
      if (isToday && now >= cutoffAt) continue;

      const isMidnight = w.key === "mid";
      const kind: Slot["kind"] = isToday
        ? isMidnight
          ? "midnight"
          : "same-day"
        : isMidnight
          ? "midnight"
          : "standard";

      const id = `d${offset}-${w.key}`;
      const h = slotHash(code, id);
      const left = 2 + (h % 17); // 2–19 "left" — stable scarcity

      slots.push({
        id,
        dateISO,
        dayLabel,
        window: w.label,
        cutoff: isToday ? `${w.cutoffLabel} today` : `${w.cutoffLabel}`,
        cutoffAt: cutoffAt.toISOString(),
        kind,
        left,
      });
    }
  }

  /* soonest upcoming cutoff — powers the "order within…" urgency strip */
  let nextCutoffAt: string | null = null;
  for (const s of slots) {
    const t = new Date(s.cutoffAt).getTime();
    if (t > now.getTime() && (!nextCutoffAt || t < new Date(nextCutoffAt).getTime())) {
      nextCutoffAt = s.cutoffAt;
    }
  }

  return NextResponse.json({
    pincode: code,
    serviceable: true,
    city: verdict.city,
    sameDay: verdict.sameDay,
    midnightAvailable: verdict.midnightAvailable,
    nextCutoffAt,
    slots,
  });
}
