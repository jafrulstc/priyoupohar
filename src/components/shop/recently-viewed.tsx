"use client";

import { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, History, X, ShoppingBag, Heart, Star, Check } from "lucide-react";
import { useShopStore, type ProductSnapshot } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";
import Link from "next/link";

/* ---------- mini card for the rail ---------- */
function RVCard({ item, index }: { item: ProductSnapshot; index: number }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);
  const isWishlisted = wishlist.some((w) => w.id === item.id);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      miniConfetti({
        x: (rect.left + rect.width / 2) / window.innerWidth,
        y: rect.top / window.innerHeight,
      });
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        category: item.category,
        slug: item.slug,
      });
      setAdded(true);
      toast({
        title: `${item.name} added!`,
        description: "Tap the bag to checkout.",
      });
      setTimeout(() => setAdded(false), 1500);
    },
    [addToCart, item, toast]
  );

  const handleWish = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleWishlist(item);
      toast({
        title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist \u2764\ufe0f",
      });
    },
    [isWishlisted, item, toggleWishlist, toast]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.06,
        type: "spring",
        stiffness: 260,
        damping: 24,
      }}
      className="group w-44 shrink-0 snap-start"
    >
      <Link
        href={`/gift/${item.slug}`}
        className="block overflow-hidden rounded-2xl border border-rose-100 bg-card shadow-soft transition-all duration-300 group-hover:-translate-y-1.5 group-hover:shadow-lift group-hover:border-rose-200 dark:border-stone-800 dark:group-hover:border-stone-700"
      >
        {/* Image */}
        <div className="relative aspect-square overflow-hidden">
          <img
            src={item.image}
            alt={item.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {/* gradient overlay for depth */}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" aria-hidden />

          {/* wishlist button */}
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleWish}
            className={cn(
              "absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full backdrop-blur-sm transition-colors",
              isWishlisted
                ? "bg-brand text-white"
                : "bg-white/90 text-charcoal hover:bg-white dark:bg-charcoal/60 dark:text-white"
            )}
            aria-label={isWishlisted ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
          >
            <Heart
              className={cn("h-4 w-4", isWishlisted && "fill-white")}
              aria-hidden
            />
          </motion.button>

          {/* same-day chip */}
          {item.sameDay && (
            <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-mint/90 px-2 py-0.5 text-[10px] font-bold text-white">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-white" aria-hidden />
              Same day
            </span>
          )}
        </div>

        {/* Body */}
        <div className="p-3">
          <h3 className="line-clamp-1 text-sm font-bold text-foreground transition-colors group-hover:text-brand">
            {item.name}
          </h3>

          {/* Rating */}
          {item.rating > 0 && (
            <div className="mt-1 flex items-center gap-1">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < Math.round(item.rating)
                        ? "fill-amber-400 text-amber-400"
                        : "fill-stone-200 text-stone-200 dark:fill-stone-700 dark:text-stone-700"
                    )}
                    aria-hidden
                  />
                ))}
              </div>
              <span className="text-[10px] font-semibold text-stone-400">
                {item.rating}
              </span>
              {item.reviews > 0 && (
                <span className="text-[10px] text-stone-400">
                  ({item.reviews})
                </span>
              )}
            </div>
          )}

          {/* Price */}
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-sm font-extrabold text-brand">
              {formatINR(item.price)}
            </span>
            {item.mrp > item.price && (
              <>
                <span className="text-[11px] font-semibold text-stone-400 line-through">
                  {formatINR(item.mrp)}
                </span>
                <span className="text-[10px] font-extrabold text-mint">
                  {discountPct(item.price, item.mrp)}% off
                </span>
              </>
            )}
          </div>

          {/* Add to bag */}
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleAdd}
            className={cn(
              "mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-extrabold transition-colors",
              added
                ? "bg-mint text-white"
                : "bg-brand text-white hover:bg-rose-700"
            )}
          >
            {added ? (
              <motion.span
                key="added"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" aria-hidden /> Added!
              </motion.span>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden /> Add to bag
              </>
            )}
          </motion.button>
        </div>
      </Link>
    </motion.div>
  );
}

/* ---------- main rail ---------- */

export default function RecentlyViewed() {
  const items = useShopStore((s) => s.recentlyViewed);
  const clear = useShopStore((s) => s.clearRecentlyViewed);
  const mounted = useMounted();
  const { toast } = useToast();
  const railRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const visible = mounted ? items : [];

  const updateEdges = useCallback(() => {
    const el = railRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 8);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8);
  }, []);

  const nudge = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 280, behavior: "smooth" });
  };

  if (visible.length === 0) return null;

  return (
    <section
      aria-label="Recently viewed gifts"
      className="pb-2 pt-14 md:pt-16"
    >
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* Section header */}
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
                toast({
                  title: "History cleared \u2728",
                  description: "A clean slate for new wishes.",
                });
              }}
              className="flex h-8 items-center gap-1 rounded-full border border-stone-200 bg-white px-3 text-[11px] font-bold text-stone-500 transition hover:border-rose-300 hover:text-brand dark:border-stone-700 dark:bg-card dark:hover:border-stone-600 dark:hover:text-rose-400"
              aria-label="Clear recently viewed"
            >
              <X className="h-3 w-3" aria-hidden /> Clear
            </button>
            <button
              onClick={() => nudge(-1)}
              disabled={atStart}
              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 bg-white text-charcoal transition hover:border-rose-300 hover:text-brand disabled:opacity-30 dark:border-stone-700 dark:bg-card dark:text-foreground dark:hover:border-stone-600 dark:hover:text-rose-400"
              aria-label="Scroll recently viewed left"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden />
            </button>
            <button
              onClick={() => nudge(1)}
              disabled={atEnd}
              className="grid h-8 w-8 place-items-center rounded-full border border-stone-200 bg-white text-charcoal transition hover:border-rose-300 hover:text-brand disabled:opacity-30 dark:border-stone-700 dark:bg-card dark:text-foreground dark:hover:border-stone-600 dark:hover:text-rose-400"
              aria-label="Scroll recently viewed right"
            >
              <ChevronRight className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </div>

        {/* Horizontal scroll rail */}
        <div
          ref={railRef}
          onScroll={updateEdges}
          className="mask-fade-x scrollbar-slim mt-5 flex gap-4 overflow-x-auto pb-2"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((item, i) => (
              <RVCard key={item.id} item={item} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Browse all link */}
        <div className="mt-4 text-center">
          <Link
            href="#bestsellers"
            className="inline-flex items-center gap-1 text-xs font-bold text-stone-400 transition hover:text-brand dark:text-stone-500 dark:hover:text-rose-400"
          >
            Explore all bestsellers →
          </Link>
        </div>
      </div>
    </section>
  );
}
