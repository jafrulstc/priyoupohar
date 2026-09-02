"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import {
  ShoppingBag,
  Check,
  Heart,
  Star,
  Sparkles,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

/* ---------- Single recommendation card ---------- */
function RecCard({ product, index }: { product: Product; index: number }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const { toast } = useToast();
  const mounted = useMounted();
  const [added, setAdded] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const isWishlisted = wishlist.some((w) => w.id === product.id);

  const handleAdd = useCallback(
    (e: React.MouseEvent) => {
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
      toast({ title: `${product.name} added to gift bag! ✨` });
      setTimeout(() => setAdded(false), 1800);
    },
    [addToCart, product, toast]
  );

  const handleWishlist = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      toggleWishlist({
        id: product.id,
        name: product.name,
        slug: product.slug,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.category,
        rating: product.rating,
        reviews: product.reviews,
        tag: product.tag,
        sameDay: product.sameDay,
        description: product.description,
      });
    },
    [toggleWishlist, product]
  );

  const off = Math.max(
    0,
    Math.round(((product.mrp - product.price) / product.mrp) * 100)
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 22,
        delay: index * 0.07,
      }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-rose-100 bg-white shadow-soft transition-all duration-300 hover:-translate-y-1 hover:shadow-lift dark:border-stone-800 dark:bg-stone-900"
    >
      {/* Image */}
      <Link
        href={`/gift/${product.slug}`}
        className="relative block aspect-square overflow-hidden"
      >
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Bottom gradient overlay for depth */}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 to-transparent" />

        {/* Same-day chip */}
        {product.sameDay && (
          <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-bold text-charcoal shadow-sm backdrop-blur-sm">
            <Sparkles className="h-2.5 w-2.5 text-mint" aria-hidden /> Same-day
          </span>
        )}

        {/* Wishlist button on image */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={handleWishlist}
          className="absolute right-2.5 top-2.5 grid h-8 w-8 place-items-center rounded-full bg-white/90 text-stone-400 shadow-sm backdrop-blur-sm transition-colors hover:text-brand dark:bg-stone-900/90 dark:text-stone-300"
          aria-label={`${isWishlisted ? "Remove from" : "Add to"} wishlist`}
        >
          <Heart
            className="h-4 w-4"
            style={{
              fill: isWishlisted ? "var(--brand)" : "none",
              color: isWishlisted ? "var(--brand)" : undefined,
            }}
          />
        </motion.button>
      </Link>

      {/* Info */}
      <div className="flex flex-1 flex-col p-3">
        <Link
          href={`/gift/${product.slug}`}
          className="line-clamp-1 text-sm font-bold text-foreground transition-colors hover:text-brand"
        >
          {product.name}
        </Link>

        {/* Rating */}
        {product.rating > 0 && (
          <div className="mt-1 flex items-center gap-1">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" aria-hidden />
            <span className="text-[11px] font-semibold text-stone-500">
              {product.rating}
            </span>
          </div>
        )}

        {/* Price */}
        <div className="mt-auto flex items-baseline gap-1.5 pt-2">
          <span className="text-base font-extrabold text-foreground">
            {formatINR(product.price)}
          </span>
          {off > 0 && (
            <>
              <span className="text-[11px] font-semibold text-stone-400 line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="text-[10px] font-extrabold text-mint">
                {off}% off
              </span>
            </>
          )}
        </div>

        {/* Add to cart button */}
        <motion.button
          ref={btnRef}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.96 }}
          onClick={handleAdd}
          className={cn(
            "mt-2.5 flex w-full items-center justify-center gap-1.5 rounded-xl py-2.5 text-xs font-extrabold shadow-soft transition-colors",
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
              <ShoppingBag className="h-3.5 w-3.5" aria-hidden /> Add to Bag
            </>
          )}
        </motion.button>
      </div>
    </motion.article>
  );
}

/* ---------- Main section ---------- */

export default function YouMayAlsoLike({
  currentSlug,
  currentCategory,
}: {
  currentSlug: string;
  currentCategory?: string;
}) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const mounted = useMounted();

  useEffect(() => {
    const ctrl = new AbortController();
    async function load() {
      try {
        const params = new URLSearchParams({ limit: "12" });
        if (currentCategory) params.set("category", currentCategory);
        const res = await fetch(`/api/products?${params}`, {
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (ctrl.signal.aborted) return;
        let items: Product[] = data?.products ?? data?.items ?? [];
        /* Filter out current product */
        items = items.filter((p: Product) => p.slug !== currentSlug);
        /* Shuffle deterministically */
        const seed = currentSlug.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
        items.sort((a: Product, b: Product) => {
          const ha = a.name.split("").reduce((x: number, c: string) => x + c.charCodeAt(0), 0);
          const hb = b.name.split("").reduce((x: number, c: string) => x + c.charCodeAt(0), 0);
          return ((ha * seed) % 997) - ((hb * seed) % 997);
        });
        setProducts(items.slice(0, 8));
      } catch {
        /* silent */
      } finally {
        if (!ctrl.signal.aborted) setLoading(false);
      }
    }
    load();
    return () => ctrl.abort();
  }, [currentSlug, currentCategory]);

  if (!mounted) return null;

  /* Loading skeletons */
  if (loading) {
    return (
      <section className="mt-16 border-t border-rose-100 pt-10 dark:border-stone-800">
        <div className="mb-6 text-center">
          <Skeleton className="mx-auto h-6 w-40 rounded-full" />
          <Skeleton className="mx-auto mt-3 h-8 w-64 rounded-xl" />
          <Skeleton className="mx-auto mt-2 h-4 w-72 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-2xl border border-rose-100 dark:border-stone-800">
              <Skeleton className="aspect-square rounded-none" />
              <div className="flex flex-1 flex-col gap-2 p-3">
                <Skeleton className="h-4 w-3/4 rounded-lg" />
                <Skeleton className="h-3 w-1/3 rounded-lg" />
                <div className="mt-auto flex items-baseline gap-1.5 pt-2">
                  <Skeleton className="h-5 w-14 rounded-lg" />
                </div>
                <Skeleton className="h-9 w-full rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="mt-16 border-t border-rose-100 pt-10 dark:border-stone-800">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="mb-6 text-center"
      >
        <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-4 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-brand dark:bg-rose-950/40 dark:text-rose-300">
          <Sparkles className="h-3 w-3" aria-hidden />
          Handpicked for you
        </span>
        <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
          You may also{" "}
          <span className="text-gradient-brand">love</span>
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-stone-500">
          Because one gift is never enough — here are more surprises they will adore.
        </p>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.map((p, i) => (
          <RecCard key={p.id} product={p} index={i} />
        ))}
      </div>

      {/* CTA to browse all */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3 }}
        className="mt-8 text-center"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
        >
          Explore all gifts
        </Link>
      </motion.div>
    </section>
  );
}
