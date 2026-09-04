"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, ThumbsUp, Quote, Send, PenLine, Check, Loader2 } from "lucide-react";
import { miniConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";
import { useProductReviews } from "@/lib/site-data";
import { pyFetch } from "@/lib/py-api";
import { formatDate, reviewLabel } from "@/lib/format";

function StarRow({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-4.5 w-4.5" : "h-3 w-3";
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

/* ------------------------------------------------------------------ */
/* Interactive star rating selector                                    */
/* ------------------------------------------------------------------ */
function StarSelector({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const [hovered, setHovered] = useState(0);
  const display = hovered || value;

  return (
    <div
      className="flex items-center gap-1"
      onMouseLeave={() => setHovered(0)}
      role="radiogroup"
      aria-label="Select rating"
    >
      {Array.from({ length: 5 }).map((_, i) => {
        const filled = i < display;
        return (
          <motion.button
            key={i}
            type="button"
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.85 }}
            onMouseEnter={() => setHovered(i + 1)}
            onClick={() => onChange(i + 1)}
            className="transition-colors focus:outline-none"
            aria-label={`${i + 1} star${i > 0 ? "s" : ""}`}
            role="radio"
            aria-checked={value === i + 1}
          >
            <Star
              className={`h-7 w-7 transition-colors sm:h-8 sm:w-8 ${
                filled
                  ? "fill-gold text-gold drop-shadow-[0_0_6px_rgba(245,158,11,0.5)]"
                  : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"
              }`}
            />
          </motion.button>
        );
      })}
      {value > 0 && (
        <span className="ml-2 text-xs font-bold text-gold">{value}/5</span>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Review form                                                         */
/* ------------------------------------------------------------------ */
function ReviewForm({
  slug,
  onSubmitted,
}: {
  slug: string;
  onSubmitted: () => void;
}) {
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const validate = useCallback(() => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Please enter your name";
    else if (name.trim().length < 2) e.name = "Name must be at least 2 characters";
    if (rating === 0) e.rating = "Please select a rating";
    if (!text.trim()) e.text = "Please write your review";
    else if (text.trim().length < 10) e.text = "Review must be at least 10 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  }, [name, rating, text]);

  const handleSubmit = useCallback(() => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    pyFetch(`/api/store/products/${encodeURIComponent(slug)}/reviews`, {
      method: "POST",
      body: { name: name.trim(), rating, text: text.trim() },
    })
      .then(() => {
        setName("");
        setRating(0);
        setText("");
        setErrors({});
        miniConfetti();
        onSubmitted();
      })
      .catch(() => {
        /* keep form state */
      })
      .finally(() => setSubmitting(false));
  }, [validate, name, rating, text, slug, submitting, onSubmitted]);

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="overflow-hidden"
    >
      <div className="rounded-2xl border-2 border-dashed border-rose-200 bg-rose-50/40 p-5 dark:border-stone-700 dark:bg-stone-900/40">
        <p className="text-sm font-bold text-foreground">
          Share your experience
        </p>
        <p className="mt-0.5 text-xs text-stone-400">
          Your review helps other gifters choose the perfect present
        </p>

        {/* Star selector */}
        <div className="mt-4">
          <StarSelector value={rating} onChange={setRating} />
          {errors.rating && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-1 text-[11px] font-semibold text-rose-500"
            >
              {errors.rating}
            </motion.p>
          )}
        </div>

        {/* Name input */}
        <div className="mt-4">
          <label
            htmlFor="review-name"
            className="text-[11px] font-bold uppercase tracking-wider text-stone-500"
          >
            Your name
          </label>
          <input
            ref={nameRef}
            id="review-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Priya S."
            maxLength={40}
            className="mt-1.5 w-full rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-stone-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-stone-700 dark:bg-stone-800 dark:placeholder:text-stone-600"
          />
          {errors.name && (
            <p className="mt-1 text-[11px] font-semibold text-rose-500">{errors.name}</p>
          )}
        </div>

        {/* Review text */}
        <div className="mt-4">
          <label
            htmlFor="review-text"
            className="text-[11px] font-bold uppercase tracking-wider text-stone-500"
          >
            Your review
          </label>
          <textarea
            id="review-text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="What made this gift special?"
            maxLength={500}
            rows={3}
            className="mt-1.5 w-full resize-none rounded-xl border border-stone-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-foreground placeholder:text-stone-300 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 dark:border-stone-700 dark:bg-stone-800 dark:placeholder:text-stone-600"
          />
          <div className="mt-1 flex items-center justify-between">
            {errors.text ? (
              <p className="text-[11px] font-semibold text-rose-500">{errors.text}</p>
            ) : (
              <span />
            )}
            <span
              className={`text-[11px] tabular-nums ${
                text.length > 450 ? "text-amber-500" : "text-stone-300"
              }`}
            >
              {text.length}/500
            </span>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleSubmit}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-xs font-extrabold text-white shadow-lift transition-shadow hover:shadow-[0_12px_24px_-8px_rgba(225,29,72,0.4)]"
          disabled={submitting}
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> : <Send className="h-3.5 w-3.5" aria-hidden />}
          {submitting ? "Submitting…" : "Submit review"}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Main reviews component                                              */
/* ------------------------------------------------------------------ */
export default function ProductReviews({
  rating: propRating,
  count: propCount,
  productId,
}: {
  rating: number;
  count: number;
  productId: string;
}) {
  const [showAll, setShowAll] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [helpfulSet, setHelpfulSet] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const { reviews, summary, loading, reload } = useProductReviews(productId);

  const displayRating = summary?.average ?? propRating;
  const displayCount = summary?.count ?? propCount;
  const distribution = summary?.distribution ?? null;

  const displayLimit = showAll ? reviews.length : Math.min(3, reviews.length);
  const visible = reviews.slice(0, displayLimit);

  const handleSubmitted = useCallback(() => {
    setShowForm(false);
    reload();
    toast({
      title: "Thank you for your review!",
      description: "Your feedback helps other gifters choose better.",
    });
  }, [reload, toast]);

  const toggleHelpful = useCallback(
    (name: string) => {
      setHelpfulSet((prev) => {
        const next = new Set(prev);
        if (next.has(name)) next.delete(name);
        else next.add(name);
        return next;
      });
    },
    []
  );

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
            <h2 className="text-2xl font-extrabold text-foreground">Reviews</h2>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {displayRating.toFixed(1)}
            </span>
            <span className="text-sm font-semibold text-stone-400">
              ({reviewLabel(displayCount)})
            </span>
          </div>
        </div>

        {/* Write a review button */}
        <AnimatePresence>
          {!showForm && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-1.5 rounded-full bg-gradient-brand px-5 py-2.5 text-xs font-extrabold text-white shadow-lift transition-shadow hover:shadow-[0_12px_24px_-8px_rgba(225,29,72,0.4)]"
            >
              <PenLine className="h-3.5 w-3.5" aria-hidden />
              Write a review
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Review form */}
      <AnimatePresence>
        {showForm && (
          <div className="mt-5">
            <ReviewForm slug={productId} onSubmitted={handleSubmitted} />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowForm(false)}
              className="mt-3 text-xs font-bold text-stone-400 transition-colors hover:text-brand"
            >
              Cancel
            </motion.button>
          </div>
        )}
      </AnimatePresence>

      {/* Rating breakdown bar */}
      <div className="mt-6 grid grid-cols-5 gap-2 rounded-2xl bg-rose-50/60 p-4 dark:bg-stone-900/50">
        {[5, 4, 3, 2, 1].map((stars) => {
          const distTotal = distribution ? Object.values(distribution).reduce((s, v) => s + v, 0) : 1;
          const distCount = distribution?.[String(stars)] ?? 0;
          const pct = distribution ? Math.round((distCount / Math.max(distTotal, 1)) * 100) : (stars === 5 ? 72 : stars === 4 ? 18 : stars === 3 ? 6 : stars === 2 ? 3 : 1);
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
          {visible.map((review, i) => {
            const helpfulKey = String(review.id);
            const isHelpful = helpfulSet.has(helpfulKey);
            return (
              <motion.div
                key={String(review.id)}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{
                  delay: 0.06 * i,
                  type: "spring",
                  stiffness: 260,
                  damping: 24,
                }}
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
                        {[review.city ?? "India", formatDate(review.created_at)]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                  </div>
                  <StarRow rating={review.rating} />
                </div>
                {review.title && <p className="mt-2 text-sm font-bold text-foreground">{review.title}</p>}
                <p className="mt-1 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
                  {review.text}
                </p>
                <button
                  onClick={() => toggleHelpful(helpfulKey)}
                  className={
                    isHelpful
                      ? "mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-brand"
                      : "mt-3 inline-flex items-center gap-1.5 text-[11px] font-bold text-stone-400 transition-colors hover:text-brand dark:text-stone-500"
                  }
                  aria-label={`${review.helpful ?? 0} people found this helpful`}
                >
                  <ThumbsUp
                    className="h-3 w-3"
                    aria-hidden
                    style={isHelpful ? { fill: "currentColor" } : undefined}
                  />
                  Helpful ({(review.helpful ?? 0) + (isHelpful ? 1 : 0)})
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Show more / less */}
      {reviews.length > 3 && (
        <AnimatePresence>
          {!showAll ? (
            <motion.button
              key="show"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAll(true)}
              className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-rose-200 px-5 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-rose-50 dark:border-stone-700 dark:text-rose-300 dark:hover:bg-stone-800"
            >
              Show all {reviewLabel(reviews.length)}
            </motion.button>
          ) : (
            <motion.button
              key="hide"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowAll(false)}
              className="mt-5 text-xs font-bold text-stone-400 transition-colors hover:text-brand"
            >
              Show less
            </motion.button>
          )}
        </AnimatePresence>
      )}
    </motion.section>
  );
}
