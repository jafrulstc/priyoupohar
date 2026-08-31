"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import {
  ArrowRight,
  MapPin,
  CalendarDays,
  Star,
  Plus,
  Truck,
  ShieldCheck,
  MoonStar,
  Check,
  Sparkles,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { miniConfetti, petalConfetti } from "@/lib/confetti";
import { formatINR } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

/* ---------------------------------- data ---------------------------------- */

const SHOWCASE = [
  {
    tab: "Flowers 🌸",
    name: "Eternal Red Roses",
    price: 549,
    mrp: 899,
    rating: 4.9,
    reviews: "2.3k",
    image: "/images/products/roses.jpg",
    back: ["/images/products/gerbera.jpg", "/images/products/lily.jpg"],
  },
  {
    tab: "Cakes 🍰",
    name: "Choco Truffle Dream",
    price: 599,
    mrp: 899,
    rating: 4.9,
    reviews: "3.5k",
    image: "/images/products/choccake.jpg",
    back: ["/images/products/velvetcake.jpg", "/images/products/forestcake.jpg"],
  },
  {
    tab: "Gifts 🎁",
    name: "Photo Memory Mug",
    price: 399,
    mrp: 599,
    rating: 4.6,
    reviews: "986",
    image: "/images/products/mug.jpg",
    back: ["/images/products/teddy.jpg", "/images/products/choco.jpg"],
  },
] as const;

const TAB_DURATION = 4.2; // seconds per auto-play tab

/* category per showcase tab (kept in sync with SHOWCASE order) */
const TAB_CATEGORY = ["flowers", "cakes", "personalised"] as const;

/* Deterministic floating particles (no Math.random at render → SSR safe) */
const PARTICLES = [
  { x: "6%", y: "18%", s: 10, d: 7, delay: 0, c: "bg-rose-300/50" },
  { x: "14%", y: "70%", s: 7, d: 9, delay: 1.2, c: "bg-amber-300/60" },
  { x: "26%", y: "32%", s: 8, d: 8, delay: 0.6, c: "bg-rose-200/70" },
  { x: "44%", y: "12%", s: 6, d: 10, delay: 2, c: "bg-amber-200/70" },
  { x: "58%", y: "24%", s: 9, d: 7.5, delay: 0.3, c: "bg-rose-300/40" },
  { x: "72%", y: "64%", s: 7, d: 9.5, delay: 1.6, c: "bg-amber-300/50" },
  { x: "86%", y: "20%", s: 10, d: 8.5, delay: 0.9, c: "bg-rose-200/60" },
  { x: "92%", y: "52%", s: 6, d: 10.5, delay: 2.4, c: "bg-amber-200/60" },
  { x: "36%", y: "84%", s: 8, d: 9, delay: 1.8, c: "bg-rose-300/40" },
  { x: "64%", y: "88%", s: 6, d: 8, delay: 0.2, c: "bg-amber-300/40" },
];

const wordVariants: Variants = {
  hidden: { opacity: 0, y: 26, rotate: 5, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    rotate: 0,
    filter: "blur(0px)",
    transition: { type: "spring", stiffness: 260, damping: 20 },
  },
};

/* --------------------------------- component -------------------------------- */

export default function Hero() {
  const { toast } = useToast();
  const addToCart = useShopStore((s) => s.addToCart);
  const location = useShopStore((s) => s.location);
  const setLocationOpen = useShopStore((s) => s.setLocationOpen);

  const [mounted, setMounted] = useState(false);
  const [tab, setTab] = useState(0);
  const [paused, setPaused] = useState(false);
  const [dateOpen, setDateOpen] = useState(false);
  const [dateIdx, setDateIdx] = useState(0);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  /* Delivery dates (client only → hydration safe) */
  const dates = useMemo(() => {
    const out: { label: string; sub: string }[] = [];
    const now = Date.now();
    for (let i = 0; i < 7; i++) {
      const d = new Date(now + i * 86400000);
      out.push({
        label:
          i === 0
            ? "Today"
            : i === 1
              ? "Tomorrow"
              : new Intl.DateTimeFormat("en-IN", { weekday: "short" }).format(d),
        sub: new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short" }).format(d),
      });
    }
    return out;
  }, []);

  /* Auto-play tabs */
  useEffect(() => {
    if (paused) return;
    const t = setInterval(
      () => setTab((v) => (v + 1) % SHOWCASE.length),
      TAB_DURATION * 1000
    );
    return () => clearInterval(t);
  }, [paused]);

  const product = SHOWCASE[tab];

  const checkDelivery = () => {
    if (!location) {
      setLocationOpen(true);
      toast({ title: "Pick your city first 📍", description: "Then we'll confirm your slot." });
      return;
    }
    petalConfetti();
    toast({
      title: `Yes! We deliver to ${location.city} 🎉`,
      description: `${dates[dateIdx].label}, ${dates[dateIdx].sub} — slots open now.`,
    });
  };

  const addShowcase = (e: React.MouseEvent) => {
    const rect = stackRef.current?.getBoundingClientRect();
    miniConfetti(
      rect
        ? {
            x: (rect.left + rect.width / 2) / window.innerWidth,
            y: (rect.top + rect.height / 2) / window.innerHeight,
          }
        : undefined
    );
    addToCart({
      id: `showcase-${product.name.toLowerCase().replace(/\s+/g, "-")}`,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      image: product.image,
      category: TAB_CATEGORY[tab],
    });
    toast({ title: "Added to your gift bag! 🛍️", description: product.name });
  };

  return (
    <section className="relative overflow-hidden" aria-label="Hero">
      {/* gradient wash + dotted texture */}
      <div className="absolute inset-0 bg-gradient-to-b from-brand-soft via-cream to-cream" aria-hidden />
      <div className="absolute inset-0 bg-dotted opacity-60" aria-hidden />

      {/* celebratory particles */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        {PARTICLES.map((p, i) => (
          <span
            key={i}
            className={cn("absolute rounded-full animate-float", p.c)}
            style={{
              left: p.x,
              top: p.y,
              width: p.s,
              height: p.s,
              animationDuration: `${p.d}s`,
              animationDelay: `${p.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 pb-14 pt-10 md:px-8 lg:grid-cols-2 lg:gap-6 lg:pb-20 lg:pt-14">
        {/* ------------------------------ LEFT ------------------------------ */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-charcoal shadow-soft backdrop-blur"
          >
            <span className="flex items-center gap-0.5" aria-hidden>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="h-3 w-3 fill-gold text-gold" />
              ))}
            </span>
            4.8/5 from 50,000+ gifters
          </motion.div>

          {/* Headline — staggered word reveal */}
          <motion.h1
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.09, delayChildren: 0.15 } } }}
            className="mt-5 text-4xl font-extrabold leading-[1.08] tracking-tight text-charcoal sm:text-5xl xl:text-6xl"
          >
            {["Make", "every", "moment"].map((w) => (
              <motion.span key={w} variants={wordVariants} className="mr-3 inline-block">
                {w}
              </motion.span>
            ))}
            <motion.span variants={wordVariants} className="relative mr-2 inline-block">
              <span className="text-gradient-brand">bloom.</span>
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 200 14"
                fill="none"
                aria-hidden
              >
                <motion.path
                  d="M3 10 Q 30 2 55 8 T 105 8 T 155 8 T 197 6"
                  stroke="#f59e0b"
                  strokeWidth="4"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ delay: 0.85, duration: 0.7, ease: "easeOut" }}
                />
              </svg>
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
            className="mt-5 max-w-md text-base font-medium leading-relaxed text-stone-600 md:text-lg"
          >
            Fresh flowers, decadent cakes &amp; personalised surprises — hand-delivered
            same-day across 400+ cities. Gifts that arrive with a heartbeat. 💝
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-7 flex flex-wrap items-center gap-3"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                document.querySelector("#bestsellers")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 text-sm font-extrabold text-white shadow-lift transition-colors hover:bg-rose-700"
            >
              Shop Bestsellers <ArrowRight className="h-4 w-4" aria-hidden />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.96 }}
              onClick={() =>
                document.querySelector("#combo-builder")?.scrollIntoView({ behavior: "smooth" })
              }
              className="inline-flex items-center gap-2 rounded-full border-2 border-charcoal/10 bg-white px-6 py-3 text-sm font-extrabold text-charcoal transition hover:border-brand hover:text-brand"
            >
              🎀 Build a Combo
            </motion.button>
          </motion.div>

          {/* Trust row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-7 flex flex-wrap gap-x-6 gap-y-2 text-xs font-bold text-stone-500"
          >
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-brand" aria-hidden /> Same-day in 2 hrs
            </span>
            <span className="flex items-center gap-1.5">
              <MoonStar className="h-4 w-4 text-brand" aria-hidden /> Midnight delivery
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-brand" aria-hidden /> 100% secure
            </span>
          </motion.div>

          {/* Delivery date & city picker widget */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.55 }}
            className="mt-8 max-w-lg"
          >
            <div className="glass rounded-3xl border border-rose-100 p-3 shadow-soft sm:rounded-full sm:p-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                {/* city */}
                <button
                  onClick={() => setLocationOpen(true)}
                  className="flex flex-1 items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-left ring-1 ring-stone-200 transition hover:ring-rose-300 sm:rounded-full"
                  aria-label="Choose delivery city"
                >
                  <MapPin className="h-4.5 w-4.5 shrink-0 text-brand" aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-400">
                      City
                    </span>
                    <span className="block truncate text-sm font-bold text-charcoal">
                      {mounted && location ? location.city : "Select city"}
                    </span>
                  </span>
                </button>

                {/* date */}
                <div className="relative flex-1">
                  <button
                    onClick={() => setDateOpen((v) => !v)}
                    aria-expanded={dateOpen}
                    className="flex w-full items-center gap-2.5 rounded-2xl bg-white px-4 py-2.5 text-left ring-1 ring-stone-200 transition hover:ring-rose-300 sm:rounded-full"
                    aria-label="Choose delivery date"
                  >
                    <CalendarDays className="h-4.5 w-4.5 shrink-0 text-brand" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-[10px] font-bold uppercase tracking-wide text-stone-400">
                        Delivery date
                      </span>
                      <span className="block truncate text-sm font-bold text-charcoal">
                        {mounted
                          ? `${dates[dateIdx]?.label}, ${dates[dateIdx]?.sub}`
                          : "Pick a date"}
                      </span>
                    </span>
                  </button>

                  <AnimatePresence>
                    {dateOpen && mounted && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.96 }}
                        transition={{ type: "spring", stiffness: 380, damping: 28 }}
                        className="absolute bottom-full left-0 z-20 mb-2 w-full min-w-[320px] rounded-3xl border border-rose-100 bg-white p-3 shadow-lift"
                      >
                        <div className="grid grid-cols-4 gap-1.5">
                          {dates.map((d, i) => (
                            <button
                              key={d.sub}
                              onClick={() => {
                                setDateIdx(i);
                                setDateOpen(false);
                              }}
                              className={cn(
                                "rounded-2xl px-2 py-2 text-center transition-all",
                                i === dateIdx
                                  ? "bg-brand text-white shadow-lift"
                                  : "bg-cream text-charcoal hover:bg-brand-soft"
                              )}
                            >
                              <span className="block text-[11px] font-extrabold">{d.label}</span>
                              <span
                                className={cn(
                                  "block text-[10px]",
                                  i === dateIdx ? "text-white/80" : "text-stone-400"
                                )}
                              >
                                {d.sub}
                              </span>
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* check */}
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={checkDelivery}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-charcoal px-5 py-3 text-sm font-extrabold text-cream transition-colors hover:bg-black sm:rounded-full"
                >
                  <Sparkles className="h-4 w-4 text-gold" aria-hidden />
                  Check
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ------------------------------ RIGHT — showcase stack ------------------------------ */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.35, duration: 0.6, type: "spring", stiffness: 120, damping: 20 }}
          className="relative mx-auto w-full max-w-[520px]"
        >
          {/* Tabs */}
          <div
            className="relative z-20 mb-6 flex justify-center gap-2"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {SHOWCASE.map((s, i) => (
              <button
                key={s.tab}
                onClick={() => setTab(i)}
                className={cn(
                  "relative overflow-hidden rounded-full px-4 py-2 text-xs font-extrabold transition-all sm:text-sm",
                  i === tab
                    ? "text-brand"
                    : "text-stone-500 hover:text-charcoal"
                )}
                aria-pressed={i === tab}
              >
                {i === tab && (
                  <motion.span
                    layoutId="hero-tab-pill"
                    className="absolute inset-0 rounded-full bg-white shadow-soft ring-1 ring-rose-100"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{s.tab}</span>
                {i === tab && !paused && (
                  <motion.span
                    key={`progress-${tab}`}
                    className="absolute bottom-0 left-0 h-0.5 bg-brand"
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: TAB_DURATION, ease: "linear" }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Stack */}
          <div
            ref={stackRef}
            className="relative h-[420px] select-none sm:h-[480px]"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
          >
            {/* backdrop cards */}
            <AnimatePresence mode="popLayout">
              {product.back.map((src, i) => (
                <motion.div
                  key={`${tab}-${src}`}
                  initial={{ opacity: 0, scale: 0.8, rotate: i === 0 ? -14 : 14, y: 30 }}
                  animate={{ opacity: 1, scale: 1, rotate: i === 0 ? -8 : 8, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8, rotate: i === 0 ? -16 : 16 }}
                  transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.06 * i }}
                  className={cn(
                    "absolute top-10 h-56 w-44 overflow-hidden rounded-3xl border-4 border-white shadow-soft sm:h-64 sm:w-52",
                    i === 0 ? "left-0 sm:left-2" : "right-0 sm:right-2"
                  )}
                >
                  <img src={src} alt="Gift preview" className="h-full w-full object-cover" />
                </motion.div>
              ))}
            </AnimatePresence>

            {/* main card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={`${tab}-main`}
                initial={{ opacity: 0, y: 44, rotate: -2, scale: 0.92 }}
                animate={{ opacity: 1, y: 0, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, y: -30, rotate: 2, scale: 0.94 }}
                transition={{ type: "spring", stiffness: 260, damping: 24 }}
                whileHover={{ y: -8, rotate: 0 }}
                className="absolute left-1/2 top-1/2 z-10 w-60 -translate-x-1/2 -translate-y-1/2 sm:w-72"
              >
                <div className="relative overflow-hidden rounded-[2rem] border-4 border-white shadow-lift">
                  <div className="relative aspect-[4/5]">
                    <img
                      src={product.image}
                      alt={product.name}
                      loading="eager"
                      fetchPriority="high"
                      decoding="sync"
                      className="h-full w-full object-cover"
                    />
                    {/* ribbon badge */}
                    <div className="absolute left-3 top-3 -rotate-6 rounded-full bg-gold px-3 py-1.5 text-[11px] font-extrabold text-charcoal shadow-soft animate-pulse-glow">
                      ✨ Bestseller
                    </div>
                    {/* info bar */}
                    <div className="absolute inset-x-2 bottom-2 flex items-center justify-between gap-2 rounded-2xl bg-white/95 p-2.5 backdrop-blur">
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-charcoal">
                          {product.name}
                        </p>
                        <p className="flex items-center gap-1 text-[10px] font-bold text-stone-500">
                          <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
                          {product.rating} · {product.reviews} reviews
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-brand">
                          {formatINR(product.price)}
                        </span>
                        <motion.button
                          whileHover={{ scale: 1.12, rotate: 6 }}
                          whileTap={{ scale: 0.88 }}
                          onClick={addShowcase}
                          className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white shadow-lift"
                          aria-label={`Add ${product.name} to cart`}
                        >
                          <Plus className="h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* floating chips */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="absolute -top-1 right-2 z-20 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-charcoal shadow-soft backdrop-blur sm:flex"
            >
              <Truck className="h-3.5 w-3.5 text-mint" aria-hidden /> Free delivery over ₹999
            </motion.div>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut", delay: 0.8 }}
              className="absolute bottom-8 left-0 z-20 hidden items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-extrabold text-charcoal shadow-soft backdrop-blur sm:flex"
            >
              <span className="grid h-4.5 w-4.5 place-items-center rounded-full bg-mint text-white">
                <Check className="h-3 w-3" aria-hidden />
              </span>
              Delivered in 2 hrs today
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
