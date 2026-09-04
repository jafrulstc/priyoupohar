"use client";

import { useState } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import {
  ArrowLeft,
  Flower2,
  ShoppingBag,
  Search,
  Moon,
  Sun,
} from "lucide-react";
import Link from "next/link";
import { useShopStore, cartCount } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatINR } from "@/lib/format";

export default function GiftPageHeader({
  productName,
  productPrice,
  productImage,
  productId,
}: {
  productName: string;
  productPrice: number;
  productImage?: string;
  productId: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const cart = useShopStore((s) => s.cart);
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const setSearchOpenStore = useShopStore((s) => s.setSearchOpen);
  const theme = useShopStore((s) => s.theme);
  const toggleTheme = useShopStore((s) => s.toggleTheme);
  const mounted = useMounted();
  const isDark = theme === "dark";

  const { scrollY } = useScroll();
  useMotionValueEvent(scrollY, "change", (y) => setScrolled(y > 120));

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 28 }}
        className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      >
        <div
          className={`transition-all duration-300 ${
            scrolled
              ? "border-b border-rose-100 bg-white/90 shadow-soft backdrop-blur-xl dark:border-stone-800 dark:bg-stone-950/90"
              : "bg-transparent"
          }`}
        >
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
            {/* Left: Back + Brand */}
            <div className="flex items-center gap-3">
              <motion.div
                whileHover={{ x: -2 }}
                whileTap={{ scale: 0.9 }}
                className="inline-block"
              >
              <Link
                href="/"
                className="flex h-9 w-9 items-center justify-center rounded-full border border-rose-100 bg-white text-stone-600 shadow-soft transition-colors hover:border-brand hover:text-brand dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-rose-500 dark:hover:text-rose-400"
                aria-label="Back to home"
              >
                <ArrowLeft className="h-4 w-4" />
              </Link>
              </motion.div>

              {/* Collapsed product info on scroll */}
              <AnimatePresence>
                {scrolled && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 28 }}
                    className="flex items-center gap-2.5 overflow-hidden"
                  >
                    {productImage && (
                      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-lg">
                        <img
                          src={productImage}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="max-w-[180px] truncate text-xs font-bold text-foreground sm:max-w-[300px]">
                        {productName}
                      </p>
                      <p className="text-[11px] font-extrabold text-brand">
                        {formatINR(productPrice)}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Center: Brand (visible when not scrolled) */}
            <AnimatePresence>
              {!scrolled && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute left-1/2 -translate-x-1/2"
                >
                  <Link href="/" className="flex items-center gap-1 text-sm font-extrabold text-foreground transition-colors hover:text-brand">
                    <Flower2 className="h-4 w-4 text-brand" aria-hidden />
                    <span>PriyoUpohar</span>
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5">
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleTheme()}
                className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition-colors hover:bg-rose-50 hover:text-brand dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-400"
                aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              >
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSearchOpenStore(true)}
                className="grid h-9 w-9 place-items-center rounded-full text-stone-500 transition-colors hover:bg-rose-50 hover:text-brand dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-400"
                aria-label="Search gifts"
              >
                <Search className="h-4 w-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCartOpen(true)}
                className="relative grid h-9 w-9 place-items-center rounded-full text-stone-500 transition-colors hover:bg-rose-50 hover:text-brand dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-400"
                aria-label={`Open gift bag, ${mounted ? cartCount(cart) : 0} items`}
              >
                <ShoppingBag className="h-4 w-4" />
                {mounted && cartCount(cart) > 0 && (
                  <motion.span
                    key={cartCount(cart)}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -right-0.5 -top-0.5 flex h-4.5 w-4.5 place-items-center rounded-full bg-brand text-[9px] font-extrabold text-white shadow-sm"
                  >
                    {cartCount(cart)}
                  </motion.span>
                )}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.header>
      {/* Spacer so content doesn't hide behind fixed header */}
      <div className="h-14" />
    </>
  );
}
