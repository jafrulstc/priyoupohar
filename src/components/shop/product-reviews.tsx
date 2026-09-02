"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, Quote } from "lucide-react";

const SAMPLE_REVIEWS = [
  {
    name: "Ananya S.",
    city: "Mumbai",
    rating: 5,
    text: "Absolutely stunning bouquet! The roses were fresh and the packaging was so elegant. My partner was overjoyed. Will definitely order again.",
    date: "2 days ago",
    helpful: 24,
  },
  {
    name: "Rahul M.",
    city: "Delhi",
    rating: 5,
    text: "Ordered for my mother's birthday — the same-day delivery was a lifesaver! Flowers arrived in perfect condition. Highly recommend.",
    date: "1 week ago",
    helpful: 18,
  },
  {
    name: "Priya K.",
    city: "Bengaluru",
    rating: 4,
    text: "Beautiful arrangement and great quality. The only tiny thing is I wished the ribbon was a bit more satin-y. But overall, a wonderful gift!",
    date: "2 weeks ago",
    helpful: 12,
  },
  {
    name: "Vikram T.",
    city: "Hyderabad",
    rating: 5,
    text: "Third time ordering from Bloom & Bliss and they never disappoint. The midnight delivery option is perfect for surprise celebrations.",
    date: "3 weeks ago",
    helpful: 31,
  },
];

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`${h} ${i < rating ? "fill-gold text-gold" : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"}`}
          aria-hidden
        />
      ))}
    </span>
  );
}

export default function ProductReviews({
  rating,
  count,
}: {
  rating: number;
  count: number;
}) {
  const [showAll, setShowAll] = useState(false);
  const visible = showAll ? SAMPLE_REVIEWS : SAMPLE_REVIEWS.slice(0, 2);

  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className="mt-16"
    >
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-stone-400">
            <Quote className="h-3.5 w-3.5 text-brand" aria-hidden />
            Customer love
          </p>
          <div className="mt-2 flex items-baseline gap-3">
            <h2 className="text-2xl font-extrabold text-foreground">
              Reviews
            </h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {rating.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-stone-400">
              ({count.toLocaleString("en-IN")} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Rating breakdown bar */}
      <div className="mt-6 grid grid-cols-5 gap-2 rounded-2xl bg-rose-50/60 p-4 dark:bg-stone-900/50">
        {[5, 4, 3, 2, 1].map((stars) => {
          const pct =
            stars === 5 ? 72 : stars === 4 ? 18 : stars === 3 ? 6 : stars === 2 ? 3 : 1;
          return (
            <div key={stars} className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold text-stone-500">{stars}★</span>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.1, duration: 0.6, ease: "easeOut" }}
                  className="h-full rounded-full bg-gold"
                />
              </div>
              <span className="text-[10px] font-semibold text-stone-400">{pct}%</span>
            </div>
          );
        })}
      </div>

      {/* Review cards */}
      <div className="mt-6 space-y-4">
        <AnimatePresence mode="popLayout">
          {visible.map((review, i) => (
            <motion.div
              key={review.name}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ delay: 0.06 * i, type: "spring", stiffness: 260, damping: 24 }}
              className="rounded-2xl border border-rose-100 bg-card p-5 shadow-soft dark:border-stone-800"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-extrabold text-white">
                    {review.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{review.name}</p>
                    <p className="text-[11px] font-semibold text-stone-400">
                      {review.city} · {review.date}
                    </p>
                  </div>
                </div>
                <StarRow rating={review.rating} />
              </div>
              <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                {review.text}
              </p>
              <button
                className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 transition-colors hover:text-brand dark:text-stone-500"
                aria-label={`${review.helpful} people found this helpful`}
              >
                <ThumbsUp className="h-3 w-3" aria-hidden />
                Helpful ({review.helpful})
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {!showAll ? (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAll(true)}
          className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-5 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-rose-50 dark:border-stone-700 dark:text-rose-300 dark:hover:bg-stone-800"
        >
          Show all {SAMPLE_REVIEWS.length} reviews
        </motion.button>
      ) : (
        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={() => setShowAll(false)}
          className="mt-5 text-xs font-bold text-stone-400 transition-colors hover:text-brand"
        >
          Show less
        </motion.button>
      )}
    </motion.section>
  );
}
