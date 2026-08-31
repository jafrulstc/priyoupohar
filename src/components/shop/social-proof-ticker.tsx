"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

const NAMES = [
  "Aarav", "Priya", "Meera", "Rohan", "Ananya", "Kabir", "Ishita", "Vihaan",
  "Sneha", "Arjun", "Diya", "Aditya", "Nisha", "Farhan",
];
const CITIES = [
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Pune",
  "Kolkata", "Jaipur", "Ahmedabad", "Kochi",
];
const ACTIONS = [
  { emoji: "🌹", name: "Velvet Red Roses" },
  { emoji: "🎂", name: "Belgian Chocolate Cake" },
  { emoji: "🧸", name: "Cuddle Teddy & Roses" },
  { emoji: "🌷", name: "Pastel Tulip Bunch" },
  { emoji: "🍫", name: "Artisan Chocolate Box" },
  { emoji: "🪴", name: "Jade Plant Duo" },
  { emoji: "💐", name: "Grand Celebration Hamper" },
  { emoji: "☕", name: "Photo Memory Mug" },
  { emoji: "🍰", name: "Red Velvet Bliss Cake" },
  { emoji: "🛍️", name: "Personalised Gift Box" },
];
const TIME_LABELS = ["just now", "a few seconds ago", "under a minute ago"];

const SHOW_DURATION = 5200;
const MIN_GAP = 9000;
const MAX_GAP = 16000;
const SESSION_KEY = "bb-social-ticker-off";

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export type SocialProof = {
  name: string;
  city: string;
  emoji: string;
  gift: string;
  time: string;
  id: number;
};

/**
 * Live "gifts happening now" social-proof ticker.
 * Floating glass card, bottom-left; dismiss persists for the session.
 */
export default function SocialProofTicker() {
  const [current, setCurrent] = useState<SocialProof | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const idRef = useRef(0);

  useEffect(() => {
    let previouslyOff = false;
    try {
      previouslyOff = window.sessionStorage.getItem(SESSION_KEY) === "1";
    } catch {
      /* sessionStorage unavailable — keep ticking */
    }

    if (previouslyOff) {
      /* Async so we don't setState synchronously inside the effect */
      const offTimer = window.setTimeout(() => setDismissed(true), 0);
      return () => window.clearTimeout(offTimer);
    }

    let showTimer: number | undefined;
    let hideTimer: number | undefined;
    let cancelled = false;

    const show = () => {
      if (cancelled) return;
      idRef.current += 1;
      setCurrent({
        name: pick(NAMES),
        city: pick(CITIES),
        emoji: pick(ACTIONS).emoji,
        gift: pick(ACTIONS).name,
        time: pick(TIME_LABELS),
        id: idRef.current,
      });
      hideTimer = window.setTimeout(hide, SHOW_DURATION);
    };

    const hide = () => {
      if (cancelled) return;
      setCurrent(null);
      showTimer = window.setTimeout(show, MIN_GAP + Math.random() * (MAX_GAP - MIN_GAP));
    };

    /* First appearance after a gentle 5s */
    showTimer = window.setTimeout(show, 5000);

    return () => {
      cancelled = true;
      if (showTimer) window.clearTimeout(showTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  const dismiss = () => {
    setCurrent(null);
    setDismissed(true);
    try {
      window.sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      /* ignore */
    }
  };

  if (dismissed) return null;

  return (
    <div className="pointer-events-none fixed bottom-20 left-3 z-[60] md:bottom-6 md:left-6">
      <AnimatePresence>
        {current && (
          <motion.div
            key={current.id}
            initial={{ opacity: 0, x: -56, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: -40, scale: 0.92 }}
            transition={{ type: "spring", stiffness: 320, damping: 26 }}
            className="pointer-events-auto flex max-w-[19rem] items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-3.5 py-3 shadow-lift backdrop-blur-md dark:border-stone-700/60 dark:bg-stone-900/80"
            role="status"
          >
            {/* Live avatar */}
            <div className="relative shrink-0">
              <span className="grid h-10 w-10 place-items-center rounded-full bg-brand-soft text-lg dark:bg-rose-950/50" aria-hidden="true">
                {current.emoji}
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 flex items-center gap-0.5 rounded-full bg-mint px-1 py-px">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
                </span>
              </span>
            </div>

            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-xs font-extrabold text-foreground">
                {current.name} from {current.city}
              </p>
              <p className="truncate text-[11px] font-semibold text-stone-500 dark:text-stone-400">
                just sent {current.gift} {current.emoji}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-wide text-mint">
                ● {current.time}
              </p>
            </div>

            <button
              onClick={dismiss}
              aria-label="Hide live activity notifications"
              className="grid h-6 w-6 shrink-0 place-items-center self-start rounded-full text-stone-300 transition hover:bg-rose-50 hover:text-brand dark:hover:bg-rose-950/40"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
