"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Truck,
  Gift,
  Percent,
  Clock,
  Tag,
  Heart,
  Star,
  type LucideIcon,
} from "lucide-react";
import { useActiveOffers } from "@/lib/site-data";
import type { Offer } from "@/lib/py-api";

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

/** offer.icon string → lucide icon (DB values, default Sparkles). */
const ICON_MAP: Record<string, LucideIcon> = {
  truck: Truck,
  gift: Gift,
  percent: Percent,
  clock: Clock,
  sparkles: Sparkles,
  tag: Tag,
  heart: Heart,
  star: Star,
};

const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

type Slide = {
  icon: LucideIcon;
  text: string;
  accent: boolean;
  code: string | null;
  endsSoon: boolean;
  message: string | null;
};

const FALLBACK_SLIDES: Slide[] = ANNOUNCEMENTS.map((a) => ({
  icon: a.icon,
  text: a.text,
  accent: a.accent,
  code: null,
  endsSoon: false,
  message: null,
}));

function offerToSlide(o: Offer): Slide {
  const endsAt = o.ends_at ? new Date(o.ends_at).getTime() : NaN;
  return {
    icon: ICON_MAP[(o.icon ?? "").toLowerCase()] ?? Sparkles,
    text: o.title,
    accent: o.accent,
    code: o.code,
    endsSoon: Number.isFinite(endsAt) && endsAt - Date.now() < THREE_DAYS_MS,
    message: o.message || null,
  };
}

/** Accent highlight: everything from the first ₹ glows gold. */
function AccentText({ text }: { text: string }) {
  const i = text.indexOf("\u20b9");
  if (i === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, i)}
      <span className="font-extrabold text-yellow-200">{text.slice(i)}</span>
    </>
  );
}

export default function AnnouncementBar() {
  const { data: offers, loading: offersLoading } = useActiveOffers();
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);

  /* DB offers while loaded; hardcoded announcements while loading/empty. */
  const slides = useMemo<Slide[]>(() => {
    if (offersLoading || offers.length === 0) return FALLBACK_SLIDES;
    return offers.map(offerToSlide);
  }, [offers, offersLoading]);

  const advance = useCallback(() => setIdx((i) => i + 1), []);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(advance, 4000);
    return () => clearInterval(id);
  }, [paused, advance]);

  const slide = slides[idx % slides.length];
  const Icon = slide.icon;

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
          <span className="flex min-w-0 flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
            <span>{slide.accent ? <AccentText text={slide.text} /> : slide.text}</span>
            {slide.code && (
              <span className="rounded-full bg-white/20 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-widest text-white">
                {slide.code}
              </span>
            )}
            {slide.endsSoon && (
              <span className="font-extrabold text-yellow-200">Ends soon!</span>
            )}
            {slide.message && (
              <span className="hidden font-medium text-white/60 sm:inline">
                {slide.message}
              </span>
            )}
          </span>
        </motion.p>
      </AnimatePresence>

      {/* dot indicators */}
      <div className="absolute right-3 top-1/2 flex -translate-y-1/2 gap-1 sm:right-6">
        {slides.map((_, i) => (
          <span
            key={i}
            className={
              i === idx % slides.length
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
