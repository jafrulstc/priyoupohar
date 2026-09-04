"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Truck,
  Clock,
  Gift,
  ShieldCheck,
  Package,
  RotateCcw,
  MapPin,
  Star,
} from "lucide-react";
import type { LegacyProduct } from "@/lib/product-map";

const TABS = [
  { id: "description" as const, label: "Details" },
  { id: "delivery" as const, label: "Delivery" },
] as const;

type TabId = (typeof TABS)[number]["id"];

/* ------------------------------------------------------------------ */
/* Description tab                                                    */
/* ------------------------------------------------------------------ */
function DescriptionTab({ product }: { product: LegacyProduct }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      <p className="text-sm leading-relaxed text-stone-600 dark:text-stone-400">
        {product.description}
      </p>

      {/* Product highlights */}
      <div className="grid grid-cols-2 gap-3 pt-2">
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-soft/50 p-3 dark:bg-rose-950/30">
          <Gift className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-xs font-bold text-foreground">Free Gift Wrap</p>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Beautifully wrapped with a complimentary message card
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-soft/50 p-3 dark:bg-rose-950/30">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-xs font-bold text-foreground">Quality Guaranteed</p>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Fresh flowers, handcrafted cakes, premium materials
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-soft/50 p-3 dark:bg-rose-950/30">
          <Package className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-xs font-bold text-foreground">Carefully Packed</p>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Secure packaging to ensure your gift arrives perfectly
            </p>
          </div>
        </div>
        <div className="flex items-start gap-2.5 rounded-xl bg-brand-soft/50 p-3 dark:bg-rose-950/30">
          <RotateCcw className="mt-0.5 h-4 w-4 shrink-0 text-brand" aria-hidden />
          <div>
            <p className="text-xs font-bold text-foreground">Easy Returns</p>
            <p className="mt-0.5 text-[11px] text-stone-500 dark:text-stone-400">
              Damaged items replaced within 24 hours of delivery
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Delivery tab                                                       */
/* ------------------------------------------------------------------ */
function DeliveryTab({ product }: { product: LegacyProduct }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.2 }}
      className="space-y-4"
    >
      {/* Delivery options */}
      <div className="space-y-3">
        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-mint/15">
            <Truck className="h-5 w-5 text-mint" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">
              {product.sameDay ? "Same-Day Delivery" : "Standard Delivery"}
            </p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              {product.sameDay
                ? "Order before 2 PM for delivery within 4 hours in metro cities"
                : "Delivered within 2\u20133 business days across 400+ cities"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-soft">
            <Clock className="h-5 w-5 text-brand" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">Midnight Delivery</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Available in metro cities \u2014 surprise them at the stroke of midnight
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-rose-100 bg-rose-50/50 p-4 dark:border-stone-800 dark:bg-stone-900/60">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-gold-soft">
            <MapPin className="h-5 w-5 text-amber-600 dark:text-amber-400" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">400+ Cities</p>
            <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
              Hand-delivered across India \u2014 from metros to tier-2 towns
            </p>
          </div>
        </div>
      </div>

      {/* Free shipping note */}
      <div className="flex items-center gap-2 rounded-xl bg-mint/10 px-4 py-3 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
        <Star className="h-4 w-4 fill-current" aria-hidden />
        Free shipping on orders above \u20B9999!
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Tabs container                                                     */
/* ------------------------------------------------------------------ */
export default function ProductDetailsTabs({
  product,
}: {
  product: LegacyProduct;
}) {
  const [active, setActive] = useState<TabId>("description");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="mt-12"
    >
      {/* Tab buttons */}
      <div
        role="tablist"
        aria-label="Product details"
        className="flex gap-1 rounded-2xl bg-stone-100 p-1 dark:bg-stone-800/60"
      >
        {TABS.map((tab) => {
          const isActive = tab.id === active;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => setActive(tab.id)}
              className="relative flex-1 rounded-xl py-2.5 text-sm font-bold transition-colors"
            >
              {isActive && (
                <motion.span
                  layoutId="detail-tab-indicator"
                  className="absolute inset-0 rounded-xl bg-card shadow-soft dark:bg-stone-700"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}
              <span
                className={
                  "relative z-10 " +
                  (isActive
                    ? "text-foreground"
                    : "text-stone-500 hover:text-stone-700 dark:text-stone-400")
                }
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="mt-6" role="tabpanel">
        <AnimatePresence mode="wait">
          {active === "description" && (
            <DescriptionTab key="desc" product={product} />
          )}
          {active === "delivery" && (
            <DeliveryTab key="del" product={product} />
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
