"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Flower2 } from "lucide-react";
import { CATEGORIES, type Product } from "@/lib/types";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import ProductCard from "@/components/shop/product-card";

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;

type TabId = "all" | (typeof CATEGORIES)[number]["id"];

type ProductsResponse = { products?: Product[] };

export default function Bestsellers() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [results, setResults] = useState<{ tab: TabId | null; products: Product[] }>(
    { tab: null, products: [] }
  );

  /* Derived loading state — true while the fetched tab doesn't match the
     active tab (also covers the very first load where tab is null). */
  const loading = results.tab !== activeTab;

  /* Fetch products for the active tab; stale responses are ignored.
     setState only happens in async callbacks (lint-clean). */
  useEffect(() => {
    let ignore = false;

    const url =
      activeTab === "all"
        ? "/api/products?limit=16"
        : `/api/products?category=${activeTab}&limit=12`;

    fetch(url)
      .then((res) => res.json() as Promise<ProductsResponse>)
      .then((payload) => {
        if (!ignore)
          setResults({ tab: activeTab, products: payload.products ?? [] });
      })
      .catch(() => {
        if (!ignore) setResults({ tab: activeTab, products: [] });
      });

    return () => {
      ignore = true;
    };
  }, [activeTab]);

  const tabs: { id: TabId; label: string; emoji: string }[] = [
    { id: "all", label: "All", emoji: "✨" },
    ...CATEGORIES.map((c) => ({ id: c.id, label: c.label, emoji: c.emoji })),
  ];

  return (
    <section id="bestsellers" className="relative scroll-mt-24 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        {/* ---------- Header ---------- */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={SPRING}
        >
          <span className="inline-flex items-center rounded-full bg-brand-soft dark:bg-rose-950/50 px-3 py-1 text-xs font-bold text-brand dark:text-rose-300">
            🔥 Most loved
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-foreground md:text-4xl">
            Bestsellers, <span className="text-gradient-brand">loved by millions</span>
          </h2>
          <p className="mt-2 max-w-xl text-sm text-stone-500 dark:text-stone-400 md:text-base">
            Handpicked gifts our customers can&apos;t stop re-ordering.
          </p>
        </motion.div>

        {/* ---------- Category tabs ---------- */}
        <div
          role="tablist"
          aria-label="Product categories"
          className="scrollbar-slim mt-6 flex gap-2 overflow-x-auto pb-1"
        >
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`relative overflow-hidden whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                  active
                    ? "text-white"
                    : "border border-stone-200 dark:border-stone-700 bg-white dark:bg-card text-stone-600 dark:text-stone-300 hover:border-rose-300 dark:hover:border-rose-700"
                }`}
              >
                {active ? (
                  <motion.span
                    layoutId="bestseller-pill"
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={SPRING}
                  />
                ) : null}
                <span className="relative z-10">
                  {tab.emoji} {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* ---------- Content ---------- */}
        {loading && results.products.length === 0 ? (
          /* First-load skeletons */
          <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-6 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-3xl" />
            ))}
          </div>
        ) : results.products.length === 0 ? (
          /* Empty state */
          <div className="mt-8 flex flex-col items-center gap-2 rounded-3xl border border-rose-100 dark:border-stone-800 bg-white dark:bg-card py-16 text-center">
            <Flower2 aria-hidden className="h-10 w-10 animate-wiggle text-rose-300" />
            <p className="font-bold text-foreground">No gifts here yet</p>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Try another category — something lovely is always blooming.
            </p>
          </div>
        ) : (
          /* Product grid */
          <div
            aria-busy={loading}
            className={`mt-8 grid grid-cols-2 gap-3 transition-opacity md:grid-cols-3 md:gap-6 xl:grid-cols-4 ${
              loading ? "opacity-50" : "opacity-100"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {results.products.map((product, i) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={SPRING}
                  className="h-full"
                >
                  <ProductCard product={product} index={i} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* ---------- View all ---------- */}
        <div className="mt-10 flex justify-center">
          <motion.button
            type="button"
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() =>
              toast({ title: "Full catalog coming to this window soon ✨" })
            }
            className="rounded-full border border-rose-200 dark:border-stone-700 px-6 py-2.5 font-bold text-brand dark:text-rose-400 transition-colors hover:bg-brand-soft dark:hover:bg-rose-950/50"
          >
            View all gifts →
          </motion.button>
        </div>
      </div>
    </section>
  );
}
