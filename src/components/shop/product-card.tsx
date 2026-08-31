"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Clock, Heart, ShoppingBag, Star } from "lucide-react";
import type { Product } from "@/lib/types";
import { discountPct, formatINR } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import { useShopStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;

const TAG_STYLES: Record<string, string> = {
  Bestseller: "bg-gold animate-pulse-glow",
  New: "bg-brand",
  Premium: "bg-charcoal",
};

/* Hydration-safe "mounted" flag: false during SSR + hydration render,
   true afterwards — no setState-in-effect (lint-clean). */
const subscribeNoop = () => () => {};
const getMountedSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  const { toast } = useToast();
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Persisted state (wishlist) — only render dependent UI after mount */
  const mounted = useSyncExternalStore(
    subscribeNoop,
    getMountedSnapshot,
    getServerSnapshot
  );
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const isWishlisted = mounted && wishlist.includes(product.id);

  /* Clear any pending "Added!" timer on unmount */
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const off = discountPct(product.price, product.mrp);

  const handleAdd = () => {
    miniConfetti();
    useShopStore.getState().addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: product.category,
    });
    toast({ title: "Added to your gift bag!", description: product.name });

    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.article
      initial={{ opacity: 0, y: 28 }}
      whileInView={{
        opacity: 1,
        y: 0,
        transition: { ...SPRING, delay: index * 0.05 },
      }}
      viewport={{ once: true, margin: "-40px" }}
      transition={SPRING}
      whileHover={{ y: -8, transition: SPRING }}
      className="group relative flex h-full flex-col rounded-3xl border border-rose-100 bg-white shadow-soft transition-shadow hover:shadow-lift"
    >
      {/* ---------- Image ---------- */}
      <div className="relative aspect-square overflow-hidden rounded-t-3xl">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, (max-width: 1280px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Tag badge (top-left) */}
        {product.tag ? (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ ...SPRING, delay: 0.2 + index * 0.05 }}
            className={`absolute left-2 top-2 z-10 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white ${
              TAG_STYLES[product.tag] ?? "bg-brand"
            }`}
          >
            {product.tag}
          </motion.span>
        ) : null}

        {/* Wishlist heart (top-right) */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.8 }}
          onClick={() => toggleWishlist(product.id)}
          aria-pressed={isWishlisted}
          aria-label={
            isWishlisted
              ? `Remove ${product.name} from wishlist`
              : `Add ${product.name} to wishlist`
          }
          className="absolute right-2 top-2 z-10 flex h-9 w-9 items-center justify-center rounded-full border border-rose-100/80 bg-white/90 shadow-sm backdrop-blur transition-colors hover:bg-white"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={isWishlisted ? "wishlisted" : "not-wishlisted"}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={SPRING}
              className="flex"
            >
              <Heart
                size={16}
                aria-hidden
                className={isWishlisted ? "fill-brand text-brand" : "text-stone-500"}
              />
            </motion.span>
          </AnimatePresence>
        </motion.button>

        {/* Same Day Delivery chip (bottom-left, never collides with tag) */}
        {product.sameDay ? (
          <span className="absolute bottom-2 left-2 z-10 flex animate-pulse-glow items-center gap-1 rounded-full bg-mint/95 px-2 py-1 text-[10px] font-bold text-white">
            <Clock size={10} aria-hidden />
            Same-day
          </span>
        ) : null}

        {/* Rating chip (bottom-right) */}
        <span className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-white/95 px-2 py-0.5 text-xs font-bold text-charcoal">
          <Star size={12} aria-hidden className="fill-gold text-gold" />
          {product.rating.toFixed(1)}
        </span>
      </div>

      {/* ---------- Body ---------- */}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex-1">
          <h3 className="line-clamp-1 text-sm font-bold text-charcoal md:text-base">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-xs text-stone-500">
            {product.description}
          </p>

          <div className="mt-2 flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5">
            <span className="text-lg font-extrabold text-brand">
              {formatINR(product.price)}
            </span>
            {off > 0 ? (
              <>
                <span className="text-xs text-stone-400 line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="text-xs font-bold text-mint">{off}% OFF</span>
              </>
            ) : null}
          </div>
        </div>

        {/* Add to Cart */}
        <button
          type="button"
          onClick={handleAdd}
          className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-xl text-sm font-bold text-white transition active:scale-95 ${
            added ? "bg-mint" : "bg-brand hover:bg-rose-700"
          }`}
        >
          <AnimatePresence mode="wait" initial={false}>
            {added ? (
              <motion.span
                key="added"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={SPRING}
                className="flex items-center gap-2"
              >
                <Check size={16} strokeWidth={3} aria-hidden />
                Added!
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ scale: 0.4, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.4, opacity: 0 }}
                transition={SPRING}
                className="flex items-center gap-2"
              >
                <ShoppingBag size={16} aria-hidden />
                Add to Cart
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </motion.article>
  );
}
