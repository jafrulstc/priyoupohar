"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock,
  Check,
  ChevronRight,
  MapPin,
  MoonStar,
  Package,
  Zap,
} from "lucide-react";
import { useShopStore, type DeliverySlot } from "@/lib/store";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type SlotsResponse = {
  pincode: string;
  serviceable: boolean;
  city: string;
  sameDay?: boolean;
  midnightAvailable?: boolean;
  nextCutoffAt?: string | null;
  slots: DeliverySlot[];
};

const KIND_META: Record<
  DeliverySlot["kind"],
  { label: string; icon: typeof Zap; chip: string }
> = {
  "same-day": {
    label: "Same-day",
    icon: Zap,
    chip: "bg-gold-soft text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
  },
  midnight: {
    label: "Midnight",
    icon: MoonStar,
    chip: "bg-charcoal/8 text-charcoal dark:bg-stone-800 dark:text-stone-200",
  },
  standard: {
    label: "Standard",
    icon: Package,
    chip: "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400",
  },
};

/** deliverySlot enum value for the legacy checkout field */
const kindToSlot = (kind: DeliverySlot["kind"]) => kind;

function CountdownStrip({ nextCutoffAt }: { nextCutoffAt: string | null }) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const label = useMemo(() => {
    if (!nextCutoffAt) return null;
    const diff = new Date(nextCutoffAt).getTime() - Date.now();
    if (diff <= 0 || diff > 12 * 3600_000) return null;
    const h = Math.floor(diff / 3600_000);
    const m = Math.floor((diff % 3600_000) / 60_000);
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }, [nextCutoffAt]);

  if (!label) return null;
  return (
    <p className="mt-1.5 flex items-center gap-1.5 text-[10px] font-bold text-amber-700 dark:text-amber-300">
      <span className="relative flex h-1.5 w-1.5" aria-hidden>
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-gold" />
      </span>
      Order within <b className="font-extrabold">{label}</b> — evening slots fill fast
    </p>
  );
}

export default function DeliverySlotPicker() {
  const location = useShopStore((s) => s.location);
  const setLocationOpen = useShopStore((s) => s.setLocationOpen);
  const chosenSlot = useShopStore((s) => s.chosenSlot);
  const setChosenSlot = useShopStore((s) => s.setChosenSlot);
  const setDeliverySlot = useShopStore((s) => s.setDeliverySlot);
  const { toast } = useToast();

  const pincode = location?.pincode ?? null;
  const [data, setData] = useState<SlotsResponse | null>(null);
  const [errorFor, setErrorFor] = useState<string | null>(null);
  const fetchSeq = useRef(0);

  /* loading + error are DERIVED from the response pincode — no sync setState in effects */
  const loading = !!pincode && data?.pincode !== pincode && errorFor !== pincode;
  const error = !!pincode && errorFor === pincode;

  useEffect(() => {
    if (!pincode) return;
    const seq = ++fetchSeq.current;
    const ctrl = new AbortController();
    fetch(`/api/slots?code=${pincode}`, { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("failed"))))
      .then((d: SlotsResponse) => {
        if (seq !== fetchSeq.current) return;
        setData(d);
        /* stale slot from a previous session/zone → drop it */
        const current = useShopStore.getState().chosenSlot;
        if (current && !d.slots.some((s) => s.id === current.id)) {
          useShopStore.getState().setChosenSlot(null);
        }
      })
      .catch((e) => {
        if (e?.name !== "AbortError" && seq === fetchSeq.current) {
          setErrorFor(pincode);
        }
      });
    return () => ctrl.abort();
  }, [pincode]);

  const groups = useMemo(() => {
    if (!data?.slots?.length) return [] as { label: string; slots: DeliverySlot[] }[];
    const byDay = new Map<string, DeliverySlot[]>();
    for (const s of data.slots) {
      const arr = byDay.get(s.dayLabel) ?? [];
      arr.push(s);
      byDay.set(s.dayLabel, arr);
    }
    return Array.from(byDay.entries()).map(([label, slots]) => ({ label, slots }));
  }, [data]);

  const pick = (slot: DeliverySlot) => {
    setChosenSlot(slot);
    setDeliverySlot(kindToSlot(slot.kind));
    toast({
      title: `${slot.dayLabel} · ${slot.window} locked in 🚚`,
      description:
        slot.kind === "midnight"
          ? "A midnight surprise — how romantic!"
          : slot.kind === "same-day"
            ? "Same-day delivery confirmed for today."
            : "We'll ring the bell right on time.",
    });
  };

  return (
    <div className="rounded-2xl border border-rose-100 bg-card p-3.5 shadow-soft dark:border-stone-800">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden />
          Delivery slot
        </p>
        {location && (
          <button
            onClick={() => setLocationOpen(true)}
            className="flex items-center gap-0.5 text-[10px] font-extrabold text-brand transition hover:text-rose-700 dark:text-rose-400"
          >
            {location.city}
            <ChevronRight className="h-3 w-3" aria-hidden />
          </button>
        )}
      </div>

      {/* no city yet */}
      {!location && (
        <button
          onClick={() => setLocationOpen(true)}
          className="mt-2.5 flex w-full items-center gap-3 rounded-xl border border-dashed border-rose-200 bg-cream px-3.5 py-3 text-left transition hover:border-brand/50 dark:border-stone-700 dark:bg-stone-900"
        >
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300">
            <MapPin className="h-4 w-4" aria-hidden />
          </span>
          <span className="min-w-0">
            <span className="block text-xs font-extrabold text-foreground">
              Choose a delivery city
            </span>
            <span className="block text-[10px] font-semibold text-stone-400">
              Live slots & same-day windows for your area
            </span>
          </span>
        </button>
      )}

      {/* loading skeletons */}
      {location && loading && (
        <div className="mt-2.5 space-y-1.5" aria-hidden>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[52px] animate-pulse rounded-xl bg-gradient-to-r from-rose-50 via-rose-100/60 to-rose-50 dark:from-stone-800 dark:via-stone-700/60 dark:to-stone-800"
            />
          ))}
        </div>
      )}

      {/* fetch error */}
      {location && error && (
        <p className="mt-2.5 rounded-xl bg-cream px-3 py-2.5 text-[11px] font-semibold text-stone-500 dark:bg-stone-900 dark:text-stone-400">
          Couldn&apos;t load slots just now — standard delivery still applies.
        </p>
      )}

      {/* unserviceable */}
      {location && !loading && data && !data.serviceable && (
        <div className="mt-2.5 rounded-xl border border-dashed border-rose-200 bg-rose-50/60 px-3.5 py-3 dark:border-stone-700 dark:bg-stone-900">
          <p className="text-xs font-extrabold text-foreground">
            No white-glove delivery to {data.city} yet 😔
          </p>
          <p className="mt-0.5 text-[10px] font-semibold text-stone-400">
            We&apos;re expanding fast — standard courier may still reach you.
          </p>
        </div>
      )}

      {/* the slots */}
      {location && !loading && data?.serviceable && groups.length > 0 && (
        <div className="mt-2.5 max-h-64 space-y-2.5 overflow-y-auto pr-0.5 scrollbar-slim">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="mb-1 flex items-center gap-1.5 text-[9px] font-extrabold uppercase tracking-widest text-stone-400 dark:text-stone-500">
                {group.label}
                <span className="h-px flex-1 bg-rose-100 dark:bg-stone-800" aria-hidden />
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                {group.slots.map((slot) => {
                  const active = chosenSlot?.id === slot.id;
                  const meta = KIND_META[slot.kind];
                  const Icon = meta.icon;
                  const scarce = slot.left <= 6;
                  return (
                    <motion.button
                      key={slot.id}
                      onClick={() => pick(slot)}
                      whileTap={{ scale: 0.96 }}
                      aria-pressed={active}
                      aria-label={`${slot.dayLabel} ${slot.window}, ${meta.label}, ${slot.left} slots left`}
                      className={cn(
                        "relative flex flex-col gap-0.5 rounded-xl border px-2.5 py-2 text-left transition",
                        active
                          ? "border-brand bg-brand-soft ring-1 ring-brand dark:border-rose-500 dark:bg-rose-950/50 dark:ring-rose-500/60"
                          : "border-stone-200 bg-cream hover:border-rose-300 hover:bg-rose-50/50 dark:border-stone-700 dark:bg-stone-800 dark:hover:border-rose-500/40 dark:hover:bg-stone-700/60"
                      )}
                    >
                      <span className="flex items-center justify-between gap-1">
                        <span
                          className={cn(
                            "text-[11px] font-extrabold leading-none",
                            active ? "text-brand dark:text-rose-300" : "text-foreground"
                          )}
                        >
                          {slot.window}
                        </span>
                        {active && (
                          <motion.span
                            initial={{ scale: 0.4 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 18 }}
                            className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-brand text-white dark:bg-rose-500"
                          >
                            <Check className="h-2.5 w-2.5" aria-hidden />
                          </motion.span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-1">
                        <span
                          className={cn(
                            "rounded-full px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide",
                            meta.chip
                          )}
                        >
                          {slot.kind === "same-day" ? "Same·day" : meta.label}
                        </span>
                        {scarce && (
                          <span className="text-[8px] font-extrabold uppercase tracking-wide text-amber-600 dark:text-amber-400">
                            {slot.left} left
                          </span>
                        )}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ))}
          <CountdownStrip nextCutoffAt={data.nextCutoffAt ?? null} />
        </div>
      )}
    </div>
  );
}
