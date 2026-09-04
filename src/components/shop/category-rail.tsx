"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { r2ProductUrl } from "@/lib/media";

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;
const SCROLL_STEP = 320;

type RailCategory = {
  label: string;
  image: string;
  emoji: string;
};

const CATEGORIES: RailCategory[] = [
  { label: "Flowers", image: r2ProductUrl("roses.jpg"), emoji: "🌸" },
  { label: "Cakes", image: r2ProductUrl("choccake.jpg"), emoji: "🍰" },
  { label: "Personalised", image: r2ProductUrl("mug.jpg"), emoji: "🎁" },
  { label: "Plants", image: r2ProductUrl("plants.jpg"), emoji: "🪴" },
  { label: "Combos", image: r2ProductUrl("combo1.jpg"), emoji: "🎀" },
  { label: "Teddy & More", image: r2ProductUrl("teddy.jpg"), emoji: "🧸" },
];

export default function CategoryRail() {
  const { toast } = useToast();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const syncEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    syncEdges();
    window.addEventListener("resize", syncEdges);
    return () => window.removeEventListener("resize", syncEdges);
  }, [syncEdges]);

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * SCROLL_STEP, behavior: "smooth" });
  };

  const handleSelect = (label: string) => {
    toast({
      title: `Browsing ${label} ✨`,
      description: "Handpicked collection loading up.",
    });
  };

  const arrowClass =
    "grid h-9 w-9 place-items-center rounded-full border border-rose-100 dark:border-stone-800 bg-white dark:bg-card text-charcoal dark:text-foreground shadow-soft transition cursor-pointer hover:border-brand hover:text-brand dark:hover:text-rose-400 active:scale-90 disabled:cursor-default disabled:opacity-40 disabled:hover:border-rose-100 dark:disabled:hover:border-stone-800 disabled:hover:text-charcoal dark:disabled:hover:text-foreground";

  return (
    <section className="py-10" aria-label="Shop by category">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-extrabold text-foreground md:text-2xl">
              Shop by Category
            </h2>
            <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
              Fresh picks for every mood
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollRail(-1)}
              disabled={atStart}
              aria-label="Scroll categories left"
              className={arrowClass}
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => scrollRail(1)}
              disabled={atEnd}
              aria-label="Scroll categories right"
              className={arrowClass}
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          ref={railRef}
          onScroll={syncEdges}
          className="scrollbar-slim mask-fade-x flex snap-x gap-4 overflow-x-auto pb-2 md:gap-6"
        >
          {CATEGORIES.map((cat, index) => (
            <motion.div
              key={cat.label}
              className="w-20 shrink-0 snap-start md:w-24"
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ ...SPRING, delay: index * 0.05 }}
            >
              <motion.button
                type="button"
                whileHover={{ y: -6 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleSelect(cat.label)}
                aria-label={`Browse ${cat.label}`}
                className="group w-full cursor-pointer rounded-2xl text-center transition focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <div className="relative mx-auto w-fit">
                  <div className="relative h-20 w-20 overflow-hidden rounded-full ring-2 ring-rose-100 dark:ring-stone-700 transition group-hover:ring-brand md:h-24 md:w-24">
                    <Image
                      src={cat.image}
                      alt={cat.label}
                      fill
                      sizes="96px"
                      priority={index < 4}
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                  </div>
                  <span
                    aria-hidden
                    className="absolute -bottom-1 -right-1 z-10 grid h-6 w-6 place-items-center rounded-full bg-white dark:bg-card text-xs shadow-soft ring-1 ring-rose-100 dark:ring-stone-800"
                  >
                    {cat.emoji}
                  </span>
                </div>
                <span className="mt-2 block text-xs font-bold text-foreground">
                  {cat.label}
                </span>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
