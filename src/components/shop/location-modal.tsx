"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MapPin, Search, Navigation, X } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const CITIES: { city: string; state: string; pincode: string }[] = [
  { city: "Mumbai", state: "Maharashtra", pincode: "400001" },
  { city: "Delhi", state: "NCT", pincode: "110001" },
  { city: "Bengaluru", state: "Karnataka", pincode: "560001" },
  { city: "Hyderabad", state: "Telangana", pincode: "500001" },
  { city: "Chennai", state: "Tamil Nadu", pincode: "600001" },
  { city: "Pune", state: "Maharashtra", pincode: "411001" },
  { city: "Kolkata", state: "West Bengal", pincode: "700001" },
  { city: "Ahmedabad", state: "Gujarat", pincode: "380001" },
  { city: "Jaipur", state: "Rajasthan", pincode: "302001" },
  { city: "Lucknow", state: "Uttar Pradesh", pincode: "226001" },
  { city: "Indore", state: "Madhya Pradesh", pincode: "452001" },
  { city: "Kochi", state: "Kerala", pincode: "682001" },
];

export default function LocationModal() {
  const isOpen = useShopStore((s) => s.isLocationOpen);
  const setOpen = useShopStore((s) => s.setLocationOpen);
  const setLocation = useShopStore((s) => s.setLocation);
  const location = useShopStore((s) => s.location);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [detecting, setDetecting] = useState(false);
  const mounted = useMounted();

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) setQuery("");
  };

  const filtered = useMemo(
    () =>
      CITIES.filter(
        (c) =>
          c.city.toLowerCase().includes(query.toLowerCase()) ||
          c.state.toLowerCase().includes(query.toLowerCase())
      ),
    [query]
  );

  const pick = (c: (typeof CITIES)[number]) => {
    setLocation({ city: c.city, state: c.state, pincode: c.pincode });
    toast({
      title: `Delivering to ${c.city} ${c.pincode} 🎯`,
      description: "Same-day & midnight slots available here.",
    });
  };

  const detect = () => {
    setDetecting(true);
    setTimeout(() => {
      setDetecting(false);
      pick(CITIES[0]);
    }, 900);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-3xl p-0 sm:max-w-lg">
        <div className="relative">
          {/* Header banner */}
          <div className="relative overflow-hidden rounded-t-3xl bg-gradient-brand px-6 pb-6 pt-6 text-white">
            <div className="absolute -right-8 -top-10 h-32 w-32 rounded-full bg-white/15 blur-xl" aria-hidden />
            <div className="absolute -left-6 bottom-0 h-20 w-20 rounded-full bg-gold/30 blur-lg" aria-hidden />
            <DialogHeader className="text-left">
              <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
                <MapPin className="h-5 w-5" aria-hidden />
                Where should we spread the joy?
              </DialogTitle>
              <DialogDescription className="text-white/85">
                Choose your city to see same-day & midnight slots.
              </DialogDescription>
            </DialogHeader>

            {/* Search */}
            <div className="relative mt-4">
              <Search
                className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
                aria-hidden
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search city or state…"
                aria-label="Search city"
                className="w-full rounded-2xl border border-white/20 bg-white/95 py-2.5 pl-10 pr-9 text-sm font-semibold text-charcoal placeholder:font-normal placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-gold"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-brand"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Body */}
          <div className="p-5">
            {/* Detect button */}
            <button
              onClick={detect}
              disabled={detecting}
              className="mb-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-200 bg-brand-soft px-4 py-3 text-sm font-bold text-brand transition-all hover:border-brand hover:shadow-soft disabled:opacity-70"
            >
              <motion.span
                animate={detecting ? { rotate: 360 } : { rotate: 0 }}
                transition={
                  detecting
                    ? { repeat: Infinity, duration: 1, ease: "linear" }
                    : { duration: 0.3 }
                }
              >
                <Navigation className="h-4 w-4" aria-hidden />
              </motion.span>
              {detecting ? "Finding you…" : "Use my current location"}
            </button>

            <p className="mb-2.5 text-xs font-bold uppercase tracking-wide text-stone-400">
              Popular cities
            </p>
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 scrollbar-slim">
              <AnimatePresence mode="popLayout">
                {filtered.map((c, i) => {
                  const active = mounted && location?.city === c.city;
                  return (
                    <motion.button
                      layout
                      key={c.city}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 400, damping: 25, delay: i * 0.02 }}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => pick(c)}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-left transition-all",
                        active
                          ? "border-brand bg-brand text-white shadow-lift"
                          : "border-stone-200 bg-white hover:border-rose-300 hover:shadow-soft"
                      )}
                    >
                      <span
                        className={cn(
                          "block text-sm font-bold",
                          active ? "text-white" : "text-charcoal"
                        )}
                      >
                        {c.city}
                      </span>
                      <span
                        className={cn(
                          "block text-[10px]",
                          active ? "text-white/80" : "text-stone-400"
                        )}
                      >
                        {c.state} · {c.pincode}
                      </span>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
            {filtered.length === 0 && (
              <div className="py-8 text-center text-sm text-stone-400">
                No cities matched “{query}” — try another spellings ✍️
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
