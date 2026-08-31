"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import {
  Flower2,
  MapPin,
  ChevronDown,
  ShoppingBag,
  Heart,
  Menu,
  X,
  Sparkles,
  Search,
  MoonStar,
} from "lucide-react";
import { useShopStore, cartCount } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Bestsellers", href: "#bestsellers" },
  { label: "Gift Finder", href: "#gift-finder" },
  { label: "Combo Builder", href: "#combo-builder" },
  { label: "Occasions", href: "#occasions" },
  { label: "Reviews", href: "#reviews" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const mounted = useMounted();

  const cart = useShopStore((s) => s.cart);
  const lastAddedAt = useShopStore((s) => s.lastAddedAt);
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const setLocationOpen = useShopStore((s) => s.setLocationOpen);
  const setSearchOpen = useShopStore((s) => s.setSearchOpen);
  const location = useShopStore((s) => s.location);
  const wishlist = useShopStore((s) => s.wishlist);
  const setWishlistOpen = useShopStore((s) => s.setWishlistOpen);

  const { scrollYProgress } = useScroll();
  const progressBar = useSpring(scrollYProgress, { stiffness: 140, damping: 28 });

  /* live countdown to the midnight-delivery cutoff (23:59 local) */
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const initial = setTimeout(tick, 0);
    const t = setInterval(tick, 30_000);
    return () => {
      clearTimeout(initial);
      clearInterval(t);
    };
  }, []);

  const countdown = useMemo(() => {
    if (now === null) return null;
    const cutoff = new Date();
    cutoff.setHours(23, 59, 0, 0);
    const diff = cutoff.getTime() - now;
    if (diff <= 0) return "ended for tonight";
    const h = Math.floor(diff / 3_600_000);
    const m = Math.floor((diff % 3_600_000) / 60_000);
    return `${h}h ${m}m left`;
  }, [now]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const count = mounted ? cartCount(cart) : 0;
  const wishCount = mounted ? wishlist.length : 0;

  const scrollTo = (href: string) => {
    setMenuOpen(false);
    document.querySelector(href)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50">
      {/* Scroll progress bar */}
      <motion.div
        style={{ scaleX: progressBar }}
        className="absolute inset-x-0 top-0 z-[60] h-[3px] origin-left bg-gradient-brand"
        aria-hidden
      />

      {/* Announcement bar — collapses on scroll */}
      <motion.div
        animate={{ height: scrolled ? 0 : "auto", opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.25 }}
        className="overflow-hidden bg-gradient-brand text-white"
      >
        <div className="mx-auto flex max-w-7xl items-center justify-center gap-2 px-4 py-1.5 text-[11px] font-semibold md:text-xs">
          <Sparkles className="h-3.5 w-3.5 animate-wiggle" aria-hidden />
          <span className="truncate">
            {mounted && countdown ? (
              <>
                <MoonStar className="mr-1 inline h-3 w-3" aria-hidden />
                Midnight delivery: <b className="font-extrabold">{countdown}</b> · Free shipping over
                ₹999
              </>
            ) : (
              "Midnight delivery available tonight · Free shipping over ₹999"
            )}
          </span>
          <Sparkles className="h-3.5 w-3.5 animate-wiggle" aria-hidden />
        </div>
      </motion.div>

      {/* Main bar */}
      <div
        className={cn(
          "transition-all duration-300",
          scrolled ? "glass border-b border-rose-100 shadow-soft" : "bg-cream/80"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-8">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-2.5"
            aria-label="Bloom & Bliss home"
          >
            <motion.span
              whileHover={{ rotate: -8, scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-brand text-white shadow-lift"
            >
              <Flower2 className="h-5 w-5" aria-hidden />
            </motion.span>
            <span className="whitespace-nowrap text-base font-extrabold tracking-tight text-charcoal sm:text-lg">
              Bloom <span className="text-gold">&amp;</span>{" "}
              <span className="text-brand">Bliss</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="ml-6 hidden items-center gap-1 lg:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="group relative rounded-full px-3.5 py-2 text-sm font-bold text-stone-600 transition-colors hover:text-brand"
              >
                {link.label}
                <span className="absolute inset-x-3.5 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100" />
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 md:gap-3">
            {/* Search trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 text-stone-400 transition-all hover:border-rose-300 hover:text-brand md:flex"
              aria-label="Search gifts"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="text-sm font-semibold">Search…</span>
              <kbd className="ml-2 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-400">
                ⌘K
              </kbd>
            </motion.button>
            <button
              onClick={() => setSearchOpen(true)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white text-charcoal transition-all hover:border-rose-300 hover:text-brand md:hidden"
              aria-label="Search gifts"
            >
              <Search className="h-4.5 w-4.5" aria-hidden />
            </button>

            {/* Location selector */}
            <button
              onClick={() => setLocationOpen(true)}
              className="hidden max-w-[180px] items-center gap-2 rounded-2xl border border-stone-200 bg-white px-3 py-2 text-left transition-all hover:border-rose-300 hover:shadow-soft sm:flex"
              aria-label="Choose delivery location"
            >
              <MapPin className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              <span className="min-w-0">
                <span className="block text-[10px] font-semibold uppercase tracking-wide text-stone-400">
                  Deliver to
                </span>
                <span className="block truncate text-sm font-bold text-charcoal">
                  {mounted && location ? location.city : "Select city"}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400" aria-hidden />
            </button>

            {/* Wishlist — compact icon on mobile */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white text-charcoal transition-all hover:border-rose-300 hover:text-brand md:hidden"
              aria-label={`Open wishlist, ${wishCount} items`}
            >
              <Heart className="h-4.5 w-4.5" aria-hidden />
              {wishCount > 0 && (
                <motion.span
                  key={`m-${wishCount}`}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-0.5 text-[9px] font-extrabold text-white"
                >
                  {wishCount}
                </motion.span>
              )}
            </button>

            {/* Wishlist — desktop */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setWishlistOpen(true)}
              className="relative hidden h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white text-charcoal transition-all hover:border-rose-300 hover:text-brand md:grid"
              aria-label={`Open wishlist, ${wishCount} items`}
            >
              <Heart className="h-4.5 w-4.5" aria-hidden />
              {wishCount > 0 && (
                <motion.span
                  key={wishCount}
                  initial={{ scale: 0.4 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 18 }}
                  className="absolute -right-1 -top-1 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-brand px-1 text-[10px] font-extrabold text-white"
                >
                  {wishCount}
                </motion.span>
              )}
            </motion.button>

            {/* Cart */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setCartOpen(true)}
              className="relative grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-lift transition-colors hover:bg-rose-700"
              aria-label={`Open gift bag, ${count} items`}
            >
              <ShoppingBag className="h-5 w-5" aria-hidden />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={`${count}-${lastAddedAt}`}
                    initial={{ scale: 0.3, y: -6 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0 }}
                    transition={{ type: "spring", stiffness: 600, damping: 16 }}
                    className="absolute -right-1.5 -top-1.5 grid h-5 min-w-5 place-items-center rounded-full bg-gold px-1 text-[10px] font-extrabold text-charcoal shadow-soft"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* One-shot ping ring whenever an item is added */}
              {lastAddedAt > 0 && (
                <span
                  key={`ping-${lastAddedAt}`}
                  className="absolute inset-0 animate-ping rounded-2xl border-2 border-gold"
                  style={{ animationIterationCount: 1, animationDuration: "0.9s" }}
                  aria-hidden
                />
              )}
            </motion.button>

            {/* Mobile menu */}
            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="grid h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-white text-charcoal lg:hidden"
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        <AnimatePresence>
          {menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
              className="overflow-hidden border-t border-rose-100 lg:hidden"
              aria-label="Mobile"
            >
              <div className="space-y-1 px-4 py-3">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setLocationOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm font-bold text-brand"
                >
                  <MapPin className="h-4 w-4" aria-hidden />
                  Deliver to {mounted && location ? location.city : "— select city"}
                </button>
                {NAV_LINKS.map((link, i) => (
                  <motion.button
                    key={link.href}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 * i }}
                    onClick={() => scrollTo(link.href)}
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-stone-700 hover:bg-rose-50 hover:text-brand"
                  >
                    {link.label}
                  </motion.button>
                ))}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </header>
  );
}
