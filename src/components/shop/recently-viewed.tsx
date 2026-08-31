"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, History, X } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

export default function RecentlyViewed() {
  const items = useShopStore((s) => s.recentlyViewed);
  const clear = useShopStore((s) => s.clearRecentlyViewed);
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const { toast } = useToast();
  const mounted = useMounted();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const visible = mounted ? items : [];

  const updateEdges = () => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  };

  const nudge = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 240, behavior: "smooth" });
  };

  if (visible.length === 0) return null;

  return (
    <section aria-label="Recently viewed gifts" className="pb-2 pt-14 md:pt-16">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
              <History className="h-3.5 w-3.5 text-brand" aria-hidden />
              Pick up where you left off
            </p>
            <h2 className="mt-1.5 text-xl font-extrabold text-foreground md:text-2xl">
              Recently <span className="text-gradient-brand">viewed</span>
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                clear();
                toast({ title: "History cleared ✨", description: "A clean slate for new wishes." });
              }}
              className="flex h-8 items-center gap-1 rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-card px-3 text-[11px] font-bold text-stone-500 dark:text-stone-400 transition hover:border-rose-300 dark:hover:border-stone-600 hover:text-brand dark:hover:text-rose-400"
              aria-label="Clear recently viewed"
            >
              <X className="h-3 w-3" aria-hidden /> Clear
            </button>
            <button
              onClick={() => nudge(-1)}
              disabled={atStart}
              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-card text-charcoal dark:text-foreground transition hover:border-rose-300 dark:hover:border-stone-600 hover:text-brand dark:hover:text-rose-400 disabled:opacity-30"
              aria-label="Scroll recently viewed left"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => nudge(1)}
              disabled={atEnd}
              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 dark:border-stone-700 bg-white dark:bg-card text-charcoal dark:text-foreground transition hover:border-rose-300 dark:hover:border-stone-600 hover:text-brand dark:hover:text-rose-400 disabled:opacity-30"
              aria-label="Scroll recently viewed right"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          onScroll={updateEdges}
          className="mask-fade-x scrollbar-slim mt-5 flex gap-4 overflow-x-auto pb-2"
        >
          {visible.map((item, i) => (
            <motion.button
              key={item.id}
              type="button"
              onClick={() => setQuickView(item)}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: "spring", stiffness: 260, damping: 24 }}
              whileHover={{ y: -5 }}
              whileTap={{ scale: 0.95 }}
              className="group w-36 shrink-0 snap-start text-center"
              aria-label={`Quick view ${item.name}`}
            >
              <span className="shadow-soft group-hover:shadow-lift group-hover:ring-brand relative mx-auto block h-28 w-28 overflow-hidden rounded-full ring-2 ring-rose-100 dark:ring-stone-700 transition-all group-hover:ring-4">
                { }
                <img
                  src={item.image}
                  alt={item.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </span>
              <span className="mt-2 line-clamp-1 block text-xs font-bold text-foreground transition-colors group-hover:text-brand">
                {item.name}
              </span>
              <span
                className={cn(
                  "mt-0.5 block text-xs font-extrabold",
                  "text-brand dark:text-rose-400"
                )}
              >
                {formatINR(item.price)}
              </span>
            </motion.button>
          ))}
        </div>
      </div>
    </section>
  );
}
