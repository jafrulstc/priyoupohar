"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Loader2, CheckCircle2, MoonStar, Banknote, Zap, BellRing } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

type PinResult =
  | { serviceable: true; city: string; state: string; sameDay: boolean; midnightAvailable: boolean; codAvailable: boolean; etaLabel: string }
  | { serviceable: false; state?: string; nearestHub?: string; notifyAvailable?: boolean };

/**
 * Pincode → delivery-ETA checker.
 * Compact, self-contained input with animated verdict card.
 */
export default function PincodeChecker({ compact = false }: { compact?: boolean }) {
  const mounted = useMounted();
  const location = useShopStore((s) => s.location);

  const [code, setCode] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "shake">("idle");
  const [result, setResult] = useState<PinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const check = async () => {
    setError(null);
    if (!/^\d{6}$/.test(code)) {
      setState("shake");
      setError("Enter a valid 6-digit pincode");
      setTimeout(() => setState("idle"), 500);
      return;
    }
    setState("loading");
    setResult(null);
    try {
      const r = await fetch(`/api/pincode?code=${code}`);
      const data = await r.json();
      if (!r.ok) throw new Error(data.error ?? "Check failed");
      await new Promise((res) => setTimeout(res, 450)); // tiny suspense beat
      setResult(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setState("idle");
    }
  };

  const prefill = mounted && location?.pincode ? location.pincode : "";

  return (
    <div className={cn("w-full", compact ? "" : "rounded-2xl")}>
      <motion.div
        animate={
          state === "shake" ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }
        }
        transition={{ duration: 0.4 }}
        className="flex items-center gap-2"
      >
        <div className="relative flex-1">
          <MapPin
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand"
            aria-hidden
          />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && check()}
            inputMode="numeric"
            autoComplete="postal-code"
            placeholder={prefill || "Enter pincode"}
            aria-label="Delivery pincode"
            className={cn(
              "w-full rounded-full border bg-white py-2.5 pl-9 pr-3 text-sm font-bold tracking-widest text-charcoal outline-none transition placeholder:tracking-normal placeholder:font-medium placeholder:text-stone-400",
              error ? "border-amber-400" : "border-stone-200 focus:border-brand focus:ring-2 focus:ring-rose-100"
            )}
          />
        </div>
        <motion.button
          whileTap={{ scale: 0.94 }}
          onClick={check}
          disabled={state === "loading"}
          className="grid h-10 min-w-[74px] place-items-center rounded-full bg-charcoal px-4 text-xs font-extrabold text-cream transition-colors hover:bg-black disabled:opacity-70"
        >
          {state === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            "Check"
          )}
        </motion.button>
      </motion.div>

      <AnimatePresence mode="wait">
        {error && !result && (
          <motion.p
            key="err"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-1.5 pl-2 text-[11px] font-bold text-amber-600"
          >
            {error}
          </motion.p>
        )}

        {result && result.serviceable && (
          <motion.div
            key={`ok-${result.city}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mt-2.5 overflow-hidden rounded-2xl border border-mint/30 bg-mint/5 p-3"
          >
            <p className="flex items-center gap-1.5 text-xs font-extrabold text-charcoal">
              <CheckCircle2 className="h-4 w-4 text-mint" aria-hidden />
              Yes! Delivers to {result.city}
              <span className="font-semibold text-stone-400">· {result.etaLabel}</span>
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {result.sameDay && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand/10 px-2 py-0.5 text-[10px] font-extrabold text-brand">
                  <Zap className="h-3 w-3" aria-hidden /> Same-day
                </span>
              )}
              {result.midnightAvailable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-charcoal/8 px-2 py-0.5 text-[10px] font-extrabold text-charcoal">
                  <MoonStar className="h-3 w-3 text-gold" aria-hidden /> Midnight
                </span>
              )}
              {result.codAvailable && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-extrabold text-amber-700">
                  <Banknote className="h-3 w-3" aria-hidden /> COD
                </span>
              )}
              <span className="inline-flex items-center gap-1 rounded-full bg-mint/15 px-2 py-0.5 text-[10px] font-extrabold text-mint">
                Free shipping eligible
              </span>
            </div>
          </motion.div>
        )}

        {result && !result.serviceable && (
          <motion.div
            key={`no-${result.state ?? "x"}`}
            initial={{ opacity: 0, y: 10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="mt-2.5 rounded-2xl border border-amber-200 bg-amber-50 p-3"
          >
            <p className="text-xs font-extrabold text-charcoal">
              🚚 Not in our direct network yet
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-stone-500">
              Nearest hub: <b>{result.nearestHub ?? "—"}</b>
              {result.state ? ` · ${result.state}` : ""}
            </p>
            {result.notifyAvailable && (
              <motion.button
                whileTap={{ scale: 0.96 }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-charcoal px-3 py-1.5 text-[10px] font-extrabold text-cream"
              >
                <BellRing className="h-3 w-3 text-gold" aria-hidden />
                Notify me at launch
              </motion.button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
