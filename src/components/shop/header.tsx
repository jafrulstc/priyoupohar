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
  Moon,
  Sun,
  ShieldCheck,
  Gift,
  User,
} from "lucide-react";
import { useShopStore, cartCount, LOYALTY_TARGET } from "@/lib/store";
import { useAdminStore } from "@/lib/admin-store";
import { useMounted } from "@/hooks/use-mounted";
import AuthSheet, { useCustomerAuth } from "@/components/shop/auth-sheet";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { label: "Bestsellers", href: "#bestsellers" },
  { label: "Gift Finder", href: "#gift-finder" },
  { label: "Combo Builder", href: "#combo-builder" },
  { label: "Occasions", href: "#occasions" },
  { label: "Bloom Club", href: "#bloom-club" },
  { label: "Reviews", href: "#reviews" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [now, setNow] = useState<number | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const mounted = useMounted();
  const { auth } = useCustomerAuth();

  const cart = useShopStore((s) => s.cart);
  const lastAddedAt = useShopStore((s) => s.lastAddedAt);
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const setLocationOpen = useShopStore((s) => s.setLocationOpen);
  const setSearchOpen = useShopStore((s) => s.setSearchOpen);
  const location = useShopStore((s) => s.location);
  const wishlist = useShopStore((s) => s.wishlist);
  const setWishlistOpen = useShopStore((s) => s.setWishlistOpen);
  const theme = useShopStore((s) => s.theme);
  const toggleTheme = useShopStore((s) => s.toggleTheme);
  const stamps = useShopStore((s) => s.stamps);
  const ordersCount = useShopStore((s) => s.ordersCount);

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

  const isDark = mounted && theme === "dark";
  const onToggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    toggleTheme();
    document.documentElement.classList.toggle("dark", next === "dark");
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
          scrolled
            ? "glass border-b border-rose-100 shadow-soft dark:border-stone-800"
            : "bg-background/80"
        )}
      >
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-4 md:gap-2 md:px-6 lg:px-8 xl:gap-3 min-[1600px]:max-w-[1560px] min-[1600px]:gap-4">
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
            <span className="hidden whitespace-nowrap text-[15px] font-extrabold tracking-tight text-foreground min-[360px]:block sm:text-lg">
              Bloom <span className="text-gold">&amp;</span>{" "}
              <span className="text-brand dark:text-rose-400">Bliss</span>
            </span>
          </button>

          {/* Desktop nav */}
          <nav className="ml-4 hidden items-center gap-1 xl:flex" aria-label="Primary">
            {NAV_LINKS.map((link) => (
              <button
                key={link.href}
                onClick={() => scrollTo(link.href)}
                className="group relative whitespace-nowrap rounded-full px-2 py-2 text-sm font-bold text-stone-600 transition-colors hover:text-brand dark:text-stone-300 dark:hover:text-rose-400 min-[1600px]:px-3.5"
              >
                {link.label}
                <span className="absolute inset-x-2 -bottom-0.5 h-0.5 origin-left scale-x-0 rounded-full bg-brand transition-transform duration-300 group-hover:scale-x-100 dark:bg-rose-400 min-[1600px]:inset-x-3.5" />
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5 sm:gap-2 md:gap-3">
            {/* Theme toggle — hidden on phones (mobile menu has a Dark mode row) */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={onToggleTheme}
              className="hidden h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-card text-gold transition-all hover:border-gold/60 hover:shadow-glow sm:grid dark:border-stone-700 dark:bg-stone-900 dark:text-amber-300"
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={isDark ? "sun" : "moon"}
                  initial={{ rotate: -90, opacity: 0, scale: 0.55 }}
                  animate={{ rotate: 0, opacity: 1, scale: 1 }}
                  exit={{ rotate: 90, opacity: 0, scale: 0.55 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="grid place-items-center"
                >
                  {isDark ? (
                    <Sun className="h-[18px] w-[18px]" aria-hidden />
                  ) : (
                    <Moon className="h-[18px] w-[18px]" aria-hidden />
                  )}
                </motion.span>
              </AnimatePresence>
            </motion.button>

            {/* Admin panel trigger */}
            <button
              onClick={() => useAdminStore.getState().openAdmin()}
              className="hidden h-10 w-10 place-items-center rounded-2xl border border-transparent text-stone-400 transition-all hover:border-rose-200 hover:bg-brand-soft hover:text-brand md:inline-flex dark:text-stone-500 dark:hover:border-rose-500/40 dark:hover:bg-stone-800 dark:hover:text-rose-300"
              aria-label="Open admin panel"
              title="Admin"
            >
              <ShieldCheck className="h-[18px] w-[18px]" aria-hidden />
            </button>

            {/* Search trigger */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.92 }}
              onClick={() => setSearchOpen(true)}
              className="hidden h-10 items-center gap-2 rounded-2xl border border-stone-200 bg-card px-3 text-stone-400 transition-all hover:border-rose-300 hover:text-brand dark:border-stone-700 dark:bg-stone-900 dark:text-stone-400 dark:hover:border-rose-500/50 min-[1600px]:flex"
              aria-label="Search gifts"
            >
              <Search className="h-4 w-4" aria-hidden />
              <span className="text-sm font-semibold">Search…</span>
              <kbd className="ml-2 rounded-md border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-400 dark:border-stone-700 dark:bg-stone-800">
                ⌘K
              </kbd>
            </motion.button>
            <button
              onClick={() => setSearchOpen(true)}
              className="grid h-9 w-9 place-items-center rounded-2xl border border-stone-200 bg-card text-foreground transition-all hover:border-rose-300 hover:text-brand sm:h-10 sm:w-10 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-rose-500/50 min-[1600px]:hidden"
              aria-label="Search gifts"
            >
              <Search className="h-4.5 w-4.5" aria-hidden />
            </button>

            {/* Location selector */}
            <button
              onClick={() => setLocationOpen(true)}
              className="hidden max-w-[180px] items-center gap-2 rounded-2xl border border-stone-200 bg-card px-3 py-2 text-left transition-all hover:border-rose-300 hover:shadow-soft dark:border-stone-700 dark:bg-stone-900 dark:hover:border-rose-500/50 sm:flex"
              aria-label="Choose delivery location"
            >
              <MapPin className="h-4 w-4 shrink-0 text-brand dark:text-rose-400" aria-hidden />
              <span className="min-w-0">
                <span className="hidden text-[10px] font-semibold uppercase tracking-wide text-stone-400 min-[1600px]:block dark:text-stone-500">
                  Deliver to
                </span>
                <span className="block truncate text-sm font-bold text-foreground">
                  {mounted && location ? location.city : "Select city"}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-stone-400 dark:text-stone-500" aria-hidden />
            </button>

            {/* Account (Task 2.4) */}
            <button
              onClick={() => setAuthOpen(true)}
              className={cn(
                "grid h-9 w-9 place-items-center rounded-2xl border transition-all sm:h-10 sm:w-10",
                auth
                  ? "border-transparent bg-gradient-brand text-white shadow-soft hover:bg-rose-700"
                  : "border-stone-200 bg-card text-foreground hover:border-rose-300 hover:text-brand dark:border-stone-700 dark:bg-stone-900 dark:hover:border-rose-500/50"
              )}
              aria-label={auth ? `Account — ${auth.user.name}` : "Sign in to your account"}
              title={auth ? auth.user.name : "Sign in"}
            >
              {auth ? (
                <span className="text-xs font-extrabold uppercase">
                  {auth.user.name.trim().charAt(0)}
                </span>
              ) : (
                <User className="h-4.5 w-4.5" aria-hidden />
              )}
            </button>

            {/* Wishlist — compact icon on mobile */}
            <button
              onClick={() => setWishlistOpen(true)}
              className="relative grid h-9 w-9 place-items-center rounded-2xl border border-stone-200 bg-card text-foreground transition-all hover:border-rose-300 hover:text-brand sm:h-10 sm:w-10 dark:border-stone-700 dark:bg-stone-900 dark:hover:border-rose-500/50 md:hidden"
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
              className="relative hidden h-10 w-10 place-items-center rounded-2xl border border-stone-200 bg-card text-foreground transition-all hover:border-rose-300 hover:text-brand dark:border-stone-700 dark:bg-stone-900 dark:hover:border-rose-500/50 md:grid"
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
              className="relative grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-lift transition-colors hover:bg-rose-700 sm:h-11 sm:w-11"
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
              className="grid h-9 w-9 place-items-center rounded-2xl border border-stone-200 bg-card text-foreground sm:h-10 sm:w-10 dark:border-stone-700 dark:bg-stone-900 xl:hidden"
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
              className="overflow-hidden border-t border-rose-100 dark:border-stone-800 xl:hidden"
              aria-label="Mobile"
            >
              <div className="space-y-1 px-4 py-3">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setLocationOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl bg-brand-soft px-3 py-2.5 text-sm font-bold text-brand dark:bg-rose-950/60 dark:text-rose-300"
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
                    className="block w-full rounded-xl px-3 py-2.5 text-left text-sm font-bold text-stone-700 hover:bg-rose-50 hover:text-brand dark:text-stone-200 dark:hover:bg-stone-800 dark:hover:text-rose-300"
                  >
                    {link.label}
                  </motion.button>
                ))}
                <button
                  onClick={onToggleTheme}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-rose-50 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <span className="flex items-center gap-2">
                    {isDark ? (
                      <Sun className="h-4 w-4 text-gold" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 text-brand" aria-hidden />
                    )}
                    {isDark ? "Light mode" : "Dark mode"}
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-extrabold",
                      isDark
                        ? "bg-gold-soft text-amber-700 dark:bg-amber-950/60 dark:text-amber-300"
                        : "bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400"
                    )}
                  >
                    {isDark ? "ON" : "OFF"}
                  </span>
                </button>

                {/* Account entry (mobile menu) */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setAuthOpen(true);
                  }}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-rose-50 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <User className="h-4 w-4 text-brand dark:text-rose-300" aria-hidden />
                  {auth ? `Hi, ${auth.user.name.split(" ")[0]}` : "Sign in / Register"}
                </button>

                {/* Admin panel entry (mobile) */}
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    useAdminStore.getState().openAdmin();
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-sm font-bold text-stone-700 hover:bg-rose-50 dark:text-stone-200 dark:hover:bg-stone-800"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-brand dark:text-rose-300" aria-hidden />
                    Admin panel
                  </span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-extrabold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                    STAFF
                  </span>
                </button>

                {/* Loyalty stamps in mobile menu */}
                {mounted && (
                  <div className="mt-2 rounded-xl border border-rose-100 bg-white p-3 dark:border-stone-800 dark:bg-stone-900">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-xs font-extrabold text-foreground">
                        <Gift className="h-4 w-4 text-gold" aria-hidden />
                        Bloom Club
                      </span>
                      <span className="text-[10px] font-bold text-stone-400">
                        {ordersCount} order{ordersCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {Array.from({ length: LOYALTY_TARGET }).map((_, i) => (
                        <div
                          key={i}
                          className={cn(
                            "grid h-8 w-8 place-items-center rounded-lg border-2 transition-colors",
                            i < stamps
                              ? "border-gold bg-gold-soft text-gold"
                              : "border-stone-200 bg-stone-50 text-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-600"
                          )}
                        >
                          <Gift className="h-3.5 w-3.5" aria-hidden />
                        </div>
                      ))}
                      <span className="ml-1 text-[10px] font-semibold text-stone-400">
                        {stamps}/{LOYALTY_TARGET}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.nav>
          )}
        </AnimatePresence>

        {/* Storefront auth + account sheet (Task 2.4) */}
        <AuthSheet open={authOpen} onOpenChange={setAuthOpen} />
      </div>
    </header>
  );
}
