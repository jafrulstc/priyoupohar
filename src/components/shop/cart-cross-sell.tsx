"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Check, Sparkles } from "lucide-react";
import { useShopStore, type ProductSnapshot } from "@/lib/store";
import { formatINR } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

/** Fallback add-ons when nothing in the bag declares a pairing. */
const ADDON_SLUGS = ["chocolate-box", "photo-mug", "cuddle-teddy", "succulent-garden"];

/**
 * "Complete the moment" — up to 3 curated add-ons that are NOT already in the
 * bag, with one-tap quick add. Rendered inside the cart drawer items area.
 * Ranking is data-driven: slugs listed in the bag items' `pairsWith` always win.
 */
export default function CartCrossSell() {
  const mounted = useMounted();
  const cart = useShopStore((s) => s.cart);
  const addToCart = useShopStore((s) => s.addToCart);
  const [products, setProducts] = useState<ProductSnapshot[]>([]);
  const [addedAt, setAddedAt] = useState<Record<string, number>>({});
  const timers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    let alive = true;
    fetch("/api/products?limit=32")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { products: ProductSnapshot[] }) => {
        if (alive) setProducts(data.products ?? []);
      })
      .catch(() => {
        /* silent — cross-sell is a bonus */
      });
    return () => {
      alive = false;
      Object.values(timers.current).forEach(clearTimeout);
    };
  }, []);

  const inCart = useMemo(() => new Set(cart.map((c) => c.id)), [cart]);

  const picks = useMemo(() => {
    if (!mounted || products.length === 0) return [];
    const cartCats = new Set(cart.map((c) => c.category));
    const available = products.filter((p) => !inCart.has(p.id));

    /* union of pairings declared by everything already in the bag,
       in declaration order (first item's pairs rank highest).
       Items may carry a slug (hero adds) — fall back to slug lookup. */
    const productById = new Map(products.map((p) => [p.id, p]));
    const productBySlug = new Map(products.map((p) => [p.slug, p]));
    const pairedSlugs: string[] = [];
    cart.forEach((c) => {
      const src = productById.get(c.id) ?? productBySlug.get(c.slug ?? "");
      src?.pairsWith
        ?.split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .forEach((slug) => {
          if (!pairedSlugs.includes(slug)) pairedSlugs.push(slug);
        });
    });

    // rank: bag items' declared pairs → curated add-on slugs → complementary categories → price
    const score = (p: ProductSnapshot) => {
      const pairIdx = pairedSlugs.indexOf(p.slug);
      if (pairIdx >= 0) return pairIdx; // declared pairing order
      const slugIdx = ADDON_SLUGS.indexOf(p.slug);
      if (slugIdx >= 0) return 100 + slugIdx; // curated order
      const complement = cartCats.size > 0 && !cartCats.has(p.category) ? 0 : 1;
      return 200 + complement * 10 + p.price / 1000;
    };
    return [...available].sort((a, b) => score(a) - score(b)).slice(0, 3);
  }, [mounted, products, cart, inCart]);

  if (mounted && products.length > 0 && picks.length === 0) return null;

  const quickAdd = (p: ProductSnapshot) => {
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      category: p.category,
    });
    miniConfetti();
    setAddedAt((m) => ({ ...m, [p.id]: Date.now() }));
    clearTimeout(timers.current[p.id]);
    timers.current[p.id] = setTimeout(() => {
      setAddedAt((m) => {
        const next = { ...m };
        delete next[p.id];
        return next;
      });
    }, 1400);
  };

  return (
    <div className="rounded-2xl border border-rose-100 bg-card p-3.5 shadow-soft dark:border-stone-800">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
        <Sparkles className="h-3 w-3 text-gold" aria-hidden />
        Complete the moment
        <span className="ml-auto text-[9px] font-bold normal-case tracking-normal text-stone-400/80">
          pairs beautifully
        </span>
      </p>
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        {picks.length === 0
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-xl bg-cream p-2 dark:bg-stone-800"
              >
                <div className="aspect-square rounded-lg bg-stone-200 dark:bg-stone-700" />
                <div className="mt-1.5 h-2.5 w-3/4 rounded bg-stone-200 dark:bg-stone-700" />
                <div className="mt-1 h-2.5 w-1/2 rounded bg-stone-200 dark:bg-stone-700" />
              </div>
            ))
          : picks.map((p, i) => {
              const justAdded = !!addedAt[p.id];
              return (
                <motion.article
                  key={p.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08, type: "spring", stiffness: 280, damping: 24 }}
                  className="group relative flex flex-col rounded-xl border border-rose-100/80 bg-cream p-2 transition-colors hover:border-rose-200 dark:border-stone-700/70 dark:bg-stone-800 dark:hover:border-stone-600"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg">
                    <img
                      src={p.image}
                      alt={p.name}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <motion.button
                      whileTap={{ scale: 0.85 }}
                      onClick={() => quickAdd(p)}
                      aria-label={`Add ${p.name} to bag`}
                      className={cn(
                        "absolute bottom-1 right-1 grid h-7 w-7 place-items-center rounded-full text-white shadow-lift transition-colors",
                        justAdded ? "bg-mint" : "bg-brand hover:bg-rose-700"
                      )}
                    >
                      {justAdded ? (
                        <Check className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        <Plus className="h-3.5 w-3.5" aria-hidden />
                      )}
                    </motion.button>
                  </div>
                  <h4 className="mt-1.5 line-clamp-1 text-[11px] font-bold leading-tight text-foreground">
                    {p.name}
                  </h4>
                  <p className="text-[11px] font-extrabold text-brand">
                    {formatINR(p.price)}
                  </p>
                </motion.article>
              );
            })}
      </div>
    </div>
  );
}
