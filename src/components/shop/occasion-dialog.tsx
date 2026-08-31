"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ShoppingBag, Check, Star, Sparkles } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

export type OccasionSelection = {
  label: string;
  emoji: string;
  midnight?: boolean;
};

/** Occasion → the shop categories we curate for it. */
const OCCASION_CATEGORIES: Record<string, string[]> = {
  "Midnight Surprise": ["cakes", "flowers"],
  Birthday: ["cakes", "personalised"],
  Anniversary: ["flowers", "personalised"],
  "Mother's Day": ["flowers", "plants"],
  Wedding: ["flowers", "combos"],
  Diwali: ["plants", "personalised"],
  "New Baby": ["plants", "personalised"],
  "Green Gifts": ["plants"],
};

const TAGLINE: Record<string, string> = {
  "Midnight Surprise": "Delivered while the clocks strike 12 🌙",
  Birthday: "Cake, blooms & joy — candles not included 😉",
  Anniversary: "Say 'still in love' without saying a word 💞",
  "Mother's Day": "For the queen who deserves the world 🌷",
  Wedding: "Gifts as grand as the occasion 💍",
  Diwali: "Light up their festive season 🪔",
  "New Baby": "Tiny arrivals, giant happiness 🍼",
  "Green Gifts": "Gifts that grow with them 🪴",
};

/* ---------- mini product card (inside the dialog) ---------- */

function MiniCard({
  product,
  index,
}: {
  product: Product;
  index: number;
}) {
  const addToCart = useShopStore((s) => s.addToCart);
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Clear any pending "Added!" timer on unmount */
  useEffect(
    () => () => {
      if (addedTimer.current) clearTimeout(addedTimer.current);
    },
    []
  );

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    miniConfetti({
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: rect.top / window.innerHeight,
    });
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: product.category,
    });
    setAdded(true);
    toast({ title: `${product.name} added 🛍️` });
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  return (
    <motion.button
      type="button"
      onClick={() => setQuickView(product)}
      initial={{ opacity: 0, y: 22, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 26, delay: index * 0.05 }}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group relative overflow-hidden rounded-2xl border border-rose-100 bg-white text-left shadow-soft transition-shadow hover:shadow-lift"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 240px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.sameDay && (
          <span className="absolute left-2 top-2 rounded-full bg-mint/95 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-soft">
            Same-day
          </span>
        )}
      </div>

      <div className="p-2.5">
        <h4 className="line-clamp-1 text-xs font-bold text-charcoal">
          {product.name}
        </h4>
        <div className="mt-1 flex items-center justify-between gap-1">
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-extrabold text-brand">
              {formatINR(product.price)}
            </span>
            {product.mrp > product.price && (
              <span className="text-[9px] font-bold text-stone-300">
                {discountPct(product.price, product.mrp)}% off
              </span>
            )}
          </div>
          <motion.span
            whileTap={{ scale: 0.85 }}
            onClick={add}
            aria-label={`Add ${product.name} to cart`}
            className={cn(
              "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-soft transition-colors",
              added ? "bg-mint" : "bg-brand hover:bg-rose-700"
            )}
          >
            {added ? (
              <motion.span
                key="done"
                initial={{ scale: 0.4 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 16 }}
              >
                <Check className="h-3.5 w-3.5" aria-hidden />
              </motion.span>
            ) : (
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
            )}
          </motion.span>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
          <span className="text-[10px] font-bold text-charcoal">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-stone-400">
            ({product.reviews.toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </motion.button>
  );
}

/* ---------- dialog shell ---------- */

export default function OccasionDialog({
  selection,
  onClose,
}: {
  selection: OccasionSelection | null;
  onClose: () => void;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const categories = selection
    ? (OCCASION_CATEGORIES[selection.label] ?? ["flowers"])
    : [];

  /* loading derived from whether we've fetched for the active occasion yet */
  const loading = !!selection && loadedFor !== selection.label;

  /* fetch curated products whenever the dialog opens for an occasion */
  useEffect(() => {
    if (!selection) return;
    const label = selection.label;
    let ignore = false;
    Promise.all(
      categories.map((c) =>
        fetch(`/api/products?category=${c}&limit=6`)
          .then((r) => (r.ok ? r.json() : { products: [] }))
          .then((d) => (Array.isArray(d?.products) ? d.products : []))
          .catch(() => [] as Product[])
      )
    )
      .then((groups) => {
        if (ignore) return;
        // interleave categories so the grid feels mixed, then dedupe + cap 8
        const merged: Product[] = [];
        const seen = new Set<string>();
        for (let i = 0; i < 6; i++) {
          for (const group of groups as Product[][]) {
            const p = group[i];
            if (p && !seen.has(p.id)) {
              seen.add(p.id);
              merged.push(p);
            }
          }
        }
        setProducts(merged.slice(0, 8));
        setLoadedFor(label);
      });
    return () => {
      ignore = true;
    };
     
  }, [selection?.label]);

  return (
    <Dialog open={!!selection} onOpenChange={(open) => !open && onClose()}>
      <AnimatePresence>
        {selection && (
          <DialogContent
            key={selection.label}
            forceMount
            className="max-h-[85vh] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-2xl"
          >
            {/* Gradient banner header */}
            <div className="relative overflow-hidden bg-gradient-brand px-5 py-5 text-white sm:px-6">
              <div
                aria-hidden
                className="bg-dotted absolute inset-0 opacity-20"
              />
              <motion.span
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 16 }}
                className="relative inline-block text-3xl drop-shadow"
              >
                {selection.emoji}
              </motion.span>
              <DialogTitle className="relative mt-1 text-xl font-extrabold tracking-tight sm:text-2xl">
                {selection.label} picks for you
              </DialogTitle>
              <DialogDescription className="relative mt-0.5 text-xs font-semibold text-white/85">
                {TAGLINE[selection.label] ??
                  "Hand-curated happiness, delivered fresh."}
              </DialogDescription>
              {selection.midnight && (
                <motion.span
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 }}
                  className="absolute right-4 top-4 rounded-full bg-white/15 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide backdrop-blur"
                >
                  ⚡ Midnight ready
                </motion.span>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[52vh] overflow-y-auto px-4 py-4 scrollbar-slim sm:px-6">
              {loading ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <div
                      key={i}
                      className="overflow-hidden rounded-2xl border border-rose-100 bg-white"
                    >
                      <div className="aspect-[4/3] animate-pulse bg-rose-100" />
                      <div className="space-y-1.5 p-2.5">
                        <div className="h-3 w-3/4 animate-pulse rounded-full bg-stone-200" />
                        <div className="h-3 w-1/3 animate-pulse rounded-full bg-stone-200" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-10 text-center">
                  <Sparkles className="h-8 w-8 text-gold" aria-hidden />
                  <p className="text-sm font-bold text-charcoal">
                    Curators are still picking…
                  </p>
                  <p className="text-xs text-stone-500">
                    Try another occasion or browse the bestsellers below.
                  </p>
                </div>
              ) : (
                <>
                  <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.14em] text-stone-400">
                    {products.length} curated treasures
                  </p>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {products.map((p, i) => (
                      <MiniCard key={p.id} product={p} index={i} />
                    ))}
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}
