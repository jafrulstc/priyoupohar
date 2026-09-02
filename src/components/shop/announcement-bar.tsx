"use client";

import { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Truck, Gift, Percent, Clock } from "lucide-react";

const ANNOUNCEMENTS = [
  {
    icon: Truck,
    text: "Free delivery on orders above ₹999",
    accent: true,
  },
  {
    icon: Gift,
    text: "Free gift wrapping on every order",
    accent: false,
  },
  {
    icon: Percent,
    text: "Use BLISS10 for 10% off your first order",
    accent: true,
  },
  {
    icon: Clock,
    text: "Same-day & midnight delivery available",
    accent: false,
  },
  {
    icon: Sparkles,
    text: "New arrivals every week — tap Bestsellers to explore",
    accent: false,
  },
] as const;

export default function AnnouncementBar() {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  const advance = useCallback(() => {
    setIdx((i) => (i + 1) % ANNOUNCEMENTS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(advance, 4000);
    return () => clearInterval(id);
  }, [paused, advance]);

  const a = ANNOUNCEMENTS[idx];
  const Icon = a.icon;

  return (
    <div
      className="relative overflow-hidden bg-gradient-brand py-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="marquee"
      aria-live="polite"
      aria-label="Promotional announcements"
    >
      {/* subtle shimmer sweep */}
      <span
        className="pointer-events-none absolute inset-0 translate-x-[-100%] bg-gradient-to-r from-transparent via-white/10 to-transparent"
        style={{
          animation: "shimmer 3s ease-in-out infinite",
          animationDelay: "1s",
        }}
        aria-hidden
      />

      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ y: 18, opacity: 0, filter: "blur(4px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: -18, opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="relative flex items-center justify-center gap-2 text-center text-xs font-bold text-white/90 sm:text-sm"
        >
          <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {a.accent ? (
              <>
                {a.text.slice(0, a.text.indexOf("\u20b9"))}
                <span className="font-extrabold text-yellow-200">
                  {a.text.slice(a.text.indexOf("\u20b9"))}
                </span>
                {a.text.includes(" ") &&
                  a.text.slice(a.text.indexOf("\u20b9") + 3)}
              </>
            ) : (
              a.text
            )}
          </span>
        </motion.p>
      </AnimatePresence>

      {/* dot indicators */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1 sm:right-6">
        {ANNOUNCEMENTS.map((_, i) => (
          <span
            key={i}
            className={
              i === idx
                ? "h-1.5 w-1.5 rounded-full bg-white/80"
                : "h-1.5 w-1.5 rounded-full bg-white/30"
            }
            aria-hidden
          />
        ))}
      </div>
    </div>
  );
}
