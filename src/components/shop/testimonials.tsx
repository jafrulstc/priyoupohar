"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Transition, type Variants } from "framer-motion";
import { ChevronLeft, ChevronRight, Heart, Quote, Star } from "lucide-react";

type Testimonial = {
  name: string;
  city: string;
  gift: string;
  stars: number;
  text: string;
};

const TESTIMONIALS: Testimonial[] = [
  {
    name: "Ananya Sharma",
    city: "Mumbai",
    gift: "Rose & Truffle Combo",
    stars: 5,
    text: "Ordered at 6 PM, delivered by 8:30 — my mom cried happy tears! The cake was STILL cold and fresh.",
  },
  {
    name: "Rohan Mehta",
    city: "Bengaluru",
    gift: "Midnight Surprise Box",
    stars: 5,
    text: "The midnight delivery is pure magic. My girlfriend's 12:01 AM reaction was priceless. Ordering again for our anniversary.",
  },
  {
    name: "Priya Nair",
    city: "Kochi",
    gift: "Pink Lilies",
    stars: 4,
    text: "Lilies were gorgeous and stayed fresh for a week. The packaging felt like unwrapping a present myself!",
  },
  {
    name: "Arjun Kapoor",
    city: "Delhi",
    gift: "Cuddle Teddy + Chocolates",
    stars: 5,
    text: "The teddy is SOFT soft. Add the chocolate box — worth every rupee. Delivery guy even carried it upstairs with a smile.",
  },
  {
    name: "Sneha Iyer",
    city: "Pune",
    gift: "Photo Memory Mug",
    stars: 5,
    text: "Printed our dog's photo on the mug — my sister laughed, then almost cried. Perfect gift, perfect quality.",
  },
];

const SPRING: Transition = { type: "spring", stiffness: 300, damping: 24 };

const slideVariants: Variants = {
  enter: { x: 60, opacity: 0 },
  center: { x: 0, opacity: 1, transition: SPRING },
  exit: { x: -60, opacity: 0, transition: SPRING },
};

const FLOATING_HEARTS = [
  { size: 30, className: "top-8 left-2 sm:left-6", delay: "0s" },
  { size: 40, className: "top-20 right-3 sm:right-10", delay: "1.2s" },
  { size: 24, className: "bottom-14 left-6 sm:left-16", delay: "2s" },
  { size: 34, className: "bottom-24 right-4 sm:right-14", delay: "0.6s" },
];

function initialsOf(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("");
}

/** Auto-playing testimonial carousel with manual controls + floating hearts. */
export default function Testimonials() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = TESTIMONIALS.length;
  const current = TESTIMONIALS[index];

  const goPrev = useCallback(
    () => setIndex((i) => (i - 1 + count) % count),
    [count]
  );
  const goNext = useCallback(
    () => setIndex((i) => (i + 1) % count),
    [count]
  );

  /* Auto-advance every 5s; effect re-runs on index change so manual
     navigation naturally resets the timer. Paused on hover. */
  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % count);
    }, 5000);
    return () => window.clearInterval(id);
  }, [paused, index, count]);

  return (
    <section
      id="reviews"
      aria-label="Customer testimonials"
      className="relative scroll-mt-24 py-16 md:py-20 max-w-5xl mx-auto px-4 md:px-8"
    >
      {/* Floating hearts */}
      {FLOATING_HEARTS.map((heart, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          className={`pointer-events-none absolute hidden sm:block text-brand/20 animate-float ${heart.className}`}
          style={{ animationDelay: heart.delay }}
        >
          <Heart size={heart.size} fill="currentColor" strokeWidth={0} />
        </motion.span>
      ))}

      {/* Header */}
      <div className="text-center mb-10 md:mb-12">
        <p className="text-sm font-bold uppercase tracking-[0.2em] text-brand dark:text-rose-400">
          💌 Wall of love
        </p>
        <h2 className="mt-3 text-3xl md:text-5xl font-extrabold text-foreground tracking-tight">
          50 lakh <span className="text-gradient-brand">hearts</span> say it best
        </h2>
        <p className="mt-3 text-stone-500 dark:text-stone-400 text-base md:text-lg max-w-xl mx-auto">
          Real reviews from real celebrations — birthdays, anniversaries and
          12:01 AM surprises.
        </p>
      </div>

      {/* Carousel controls + card */}
      <div className="flex items-center gap-3 md:gap-5">
        <button
          type="button"
          onClick={goPrev}
          aria-label="Previous testimonial"
          className="shrink-0 grid place-items-center h-11 w-11 rounded-full border border-rose-200 dark:border-stone-700 bg-white dark:bg-card text-charcoal dark:text-foreground transition hover:bg-brand-soft dark:hover:bg-rose-950/50 hover:border-brand/40 active:scale-95"
        >
          <ChevronLeft size={20} />
        </button>

        <div
          className="relative flex-1 min-w-0"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          <div className="relative bg-white dark:bg-card rounded-3xl shadow-lift border border-rose-100 dark:border-stone-800 p-6 md:p-10 text-center overflow-hidden">
            <Quote
              size={40}
              aria-hidden="true"
              className="absolute top-4 left-6 text-brand/20"
              fill="currentColor"
              strokeWidth={0}
            />

            <AnimatePresence mode="wait">
              <motion.blockquote
                key={index}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                aria-live="polite"
                className="relative"
              >
                {/* Stars */}
                <div
                  className="flex items-center justify-center gap-1 mb-4"
                  aria-label={`Rated ${current.stars} out of 5 stars`}
                >
                  {Array.from({ length: 5 }).map((_, starIdx) => (
                    <Star
                      key={starIdx}
                      size={16}
                      aria-hidden="true"
                      className={
                        starIdx < current.stars
                          ? "fill-gold text-gold"
                          : "text-stone-300"
                      }
                    />
                  ))}
                </div>

                <p className="min-h-[132px] md:min-h-[96px] flex items-center justify-center text-lg md:text-xl font-medium text-foreground leading-relaxed">
                  {current.text}
                </p>

                {/* Author row */}
                <footer className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
                  <span
                    aria-hidden="true"
                    className="grid place-items-center h-12 w-12 rounded-full bg-gradient-brand text-white font-bold text-sm tracking-wide shadow-soft"
                  >
                    {initialsOf(current.name)}
                  </span>
                  <span className="font-bold text-foreground">{current.name}</span>
                  <span className="text-stone-500 dark:text-stone-400">· {current.city}</span>
                  <span className="bg-brand-soft dark:bg-rose-950/50 text-brand dark:text-rose-300 text-xs rounded-full px-3 py-1 font-bold">
                    {current.gift}
                  </span>
                </footer>
              </motion.blockquote>
            </AnimatePresence>
          </div>
        </div>

        <button
          type="button"
          onClick={goNext}
          aria-label="Next testimonial"
          className="shrink-0 grid place-items-center h-11 w-11 rounded-full border border-rose-200 dark:border-stone-700 bg-white dark:bg-card text-charcoal dark:text-foreground transition hover:bg-brand-soft dark:hover:bg-rose-950/50 hover:border-brand/40 active:scale-95"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Dots */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {TESTIMONIALS.map((t, dotIdx) => (
          <motion.button
            key={t.name}
            type="button"
            layout
            transition={SPRING}
            onClick={() => setIndex(dotIdx)}
            aria-label={`Go to testimonial ${dotIdx + 1} — ${t.name}`}
            aria-current={dotIdx === index ? "true" : undefined}
            className={`h-2.5 rounded-full transition-colors ${
              dotIdx === index
                ? "w-6 bg-brand"
                : "w-2.5 bg-stone-300 dark:bg-stone-700 hover:bg-stone-400 dark:hover:bg-stone-600"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
