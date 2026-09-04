"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  Check,
  Star,
  Sparkles,
  Wand2,
  RotateCcw,
  Zap,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { celebrationConfetti, miniConfetti } from "@/lib/confetti";
import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/* ---------------------------------- data ---------------------------------- */

type Option = {
  id: string;
  label: string;
  emoji: string;
  cats?: string[];
  min?: number;
  max?: number;
};

const RECIPIENTS: Option[] = [
  { id: "partner", label: "Partner", emoji: "💖", cats: ["flowers", "combos"] },
  { id: "mom", label: "Mom", emoji: "🌷", cats: ["flowers", "plants"] },
  { id: "friend", label: "Best Friend", emoji: "🎉", cats: ["personalised", "cakes"] },
  { id: "kid", label: "Kids", emoji: "🧸", cats: ["cakes", "personalised"] },
  { id: "colleague", label: "Colleague", emoji: "💼", cats: ["plants", "personalised"] },
  { id: "grandma", label: "Grandparents", emoji: "👵", cats: ["plants", "flowers"] },
];

const OCCASIONS: Option[] = [
  { id: "birthday", label: "Birthday", emoji: "🎂", cats: ["cakes", "personalised"] },
  { id: "anniversary", label: "Anniversary", emoji: "💞", cats: ["flowers", "personalised"] },
  { id: "thanks", label: "Thank You", emoji: "🙏", cats: ["personalised", "flowers"] },
  { id: "congrats", label: "Congrats", emoji: "🏆", cats: ["cakes", "flowers"] },
  { id: "house", label: "Housewarming", emoji: "🏡", cats: ["plants", "personalised"] },
  { id: "because", label: "Just Because", emoji: "🌼", cats: ["flowers", "cakes"] },
];

const BUDGETS: Option[] = [
  { id: "b1", label: "Under ₹500", emoji: "🌱", min: 0, max: 499 },
  { id: "b2", label: "₹500 – ₹999", emoji: "🌸", min: 500, max: 999 },
  { id: "b3", label: "₹1,000 – ₹1,999", emoji: "💎", min: 1000, max: 1999 },
  { id: "b4", label: "Sky's the limit", emoji: "🚀", min: 2000, max: Infinity },
];

const STEPS = [
  { key: "recipient", title: "Who's the lucky one?", sub: "We'll match their vibe." },
  { key: "occasion", title: "What's the occasion?", sub: "Every moment has its bloom." },
  { key: "budget", title: "What's your budget?", sub: "Great gifts happen at every price." },
] as const;

/* ------------------------------ result card ------------------------------- */

function MatchCard({
  product,
  index,
  onAdd,
}: {
  product: Product;
  index: number;
  onAdd: (p: Product, e: React.MouseEvent) => void;
}) {
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const [added, setAdded] = useState(false);
  const addedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const add = (e: React.MouseEvent) => {
    e.stopPropagation();
    onAdd(product, e);
    setAdded(true);
    if (addedTimer.current) clearTimeout(addedTimer.current);
    addedTimer.current = setTimeout(() => setAdded(false), 1500);
  };

  /* deterministic "match %" — stable across renders */
  const match = 91 + ((index * 7 + product.name.length) % 9); // 91–99

  return (
    <motion.div
      initial={{ opacity: 0, y: 26, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, delay: index * 0.07 }}
      whileHover={{ y: -6 }}
      className="group relative cursor-pointer overflow-hidden rounded-2xl border border-rose-100 dark:border-stone-800 bg-white dark:bg-card text-left shadow-soft transition-shadow hover:shadow-lift"
      onClick={() => setQuickView(product)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && setQuickView(product)}
      aria-label={`View ${product.name}`}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-cream dark:bg-muted">
        <Image
          src={product.image}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, 220px"
          className="object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {product.sameDay && (
          <span className="absolute left-2 top-2 flex items-center gap-0.5 rounded-full bg-mint/95 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-white shadow-soft">
            <Zap className="h-2.5 w-2.5" aria-hidden /> Same-day
          </span>
        )}
        {/* match score ribbon — bottom-right of the image, never collides with the Same-day flag */}
        <span className="absolute bottom-2 right-2 rounded-full bg-charcoal/85 px-2 py-0.5 text-[9px] font-extrabold text-gold backdrop-blur">
          {match}% match
        </span>
      </div>
      <div className="p-2.5">
        <h4 className="line-clamp-1 text-xs font-bold text-foreground">{product.name}</h4>
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
          <motion.button
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
          </motion.button>
        </div>
        <div className="mt-1 flex items-center gap-1">
          <Star className="h-3 w-3 fill-gold text-gold" aria-hidden />
          <span className="text-[10px] font-bold text-foreground">
            {product.rating.toFixed(1)}
          </span>
          <span className="text-[10px] text-stone-400">
            ({product.reviews.toLocaleString("en-IN")})
          </span>
        </div>
      </div>
    </motion.div>
  );
}

/* ------------------------------ the wizard -------------------------------- */

export default function GiftFinder() {
  const addToCart = useShopStore((s) => s.addToCart);
  const { toast } = useToast();

  const [step, setStep] = useState(0); // 0..2, 3 = results
  const [dir, setDir] = useState(1);
  const [answers, setAnswers] = useState<{ recipient?: Option; occasion?: Option; budget?: Option }>({});
  const [picks, setPicks] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedAll, setAddedAll] = useState(false);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const progress = step >= 3 ? 100 : ((step + 1) / 3) * 100;

  const choose = (option: Option) => {
    const key = STEPS[step]?.key;
    if (!key) return;
    const next = { ...answers, [key]: option };
    setAnswers(next);
    // short suspense beat so the selection feels "acknowledged"
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = setTimeout(() => {
      if (step < 2) {
        setDir(1);
        setStep(step + 1);
      } else {
        void runSearch(next);
      }
    }, 280);
  };

  const runSearch = async (a: typeof answers) => {
    setDir(1);
    setStep(3);
    setLoading(true);
    setAddedAll(false);

    // Score categories: chosen in both → strongest signal.
    const score = new Map<string, number>();
    const addCats = (cats: string[] | undefined, w: number) =>
      cats?.forEach((c) => score.set(c, (score.get(c) ?? 0) + w));
    addCats(a.recipient?.cats, 1);
    addCats(a.occasion?.cats, 1);
    const ranked = [...score.entries()].sort((x, y) => y[1] - x[1]).map(([c]) => c);
    // fetch EVERY scored category (up to 4) so small budgets still find real matches
    const topCats = ranked.slice(0, 4);
    while (topCats.length < 2) topCats.push(topCats.length === 0 ? "flowers" : "personalised");

    try {
      const groups = await Promise.all(
        topCats.map((c) =>
          fetch(`/api/products?category=${c}&limit=10`)
            .then((r) => (r.ok ? r.json() : { products: [] }))
            .then((d) => (Array.isArray(d?.products) ? d.products : []))
            .catch(() => [] as Product[])
        )
      );

      // interleave + dedupe
      const merged: Product[] = [];
      const seen = new Set<string>();
      for (let i = 0; i < 10; i++) {
        for (const g of groups as Product[][]) {
          if (g[i] && !seen.has(g[i].id)) {
            seen.add(g[i].id);
            merged.push(g[i]);
          }
        }
      }

      // budget filter with graceful relaxation (only when truly starved);
      // strict in-budget matches always rank ahead of stretched ones
      const min = a.budget?.min ?? 0;
      const max = a.budget?.max ?? Infinity;
      const inBudget = merged.filter((p) => p.price >= min && p.price <= max);
      let finalPicks = inBudget;
      if (inBudget.length < 4) {
        const inSet = new Set(inBudget);
        const stretch = merged.filter(
          (p) => !inSet.has(p) && p.price >= min * 0.7 && p.price <= max * 1.6
        );
        finalPicks = [
          ...inBudget.sort((x, y) => y.rating - x.rating),
          ...stretch.sort((x, y) => y.rating - x.rating),
        ];
      }
      setPicks(finalPicks.slice(0, 6));
      celebrationConfetti();
    } finally {
      setLoading(false);
    }
  };

  const addAll = (e: React.MouseEvent) => {
    picks.forEach((p) =>
      addToCart({
        id: p.id,
        name: p.name,
        price: p.price,
        mrp: p.mrp,
        image: p.image,
        category: p.category,
      })
    );
    celebrationConfetti();
    setAddedAll(true);
    toast({
      title: `${picks.length} gifts added to your bag! 🛍️`,
      description: "The whole shortlist — bold move, we love it.",
    });
    setTimeout(() => setAddedAll(false), 2000);
  };

  const addOne = (p: Product, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    miniConfetti({
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: rect.top / window.innerHeight,
    });
    addToCart({
      id: p.id,
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      image: p.image,
      category: p.category,
    });
    toast({ title: `${p.name} added 🛍️` });
  };

  const back = () => {
    setDir(-1);
    setStep((s) => Math.max(0, s - 1));
  };

  const retake = () => {
    setAnswers({});
    setPicks([]);
    setDir(-1);
    setStep(0);
  };

  const total = picks.reduce((s, p) => s + p.price, 0);
  const chip =
    answers.recipient && answers.occasion
      ? `For ${answers.recipient.label} · ${answers.occasion.label}${
          answers.budget ? ` · ${answers.budget.label}` : ""
        }`
      : "";

  const optionSets: Option[][] = [RECIPIENTS, OCCASIONS, BUDGETS];

  return (
    <section
      id="gift-finder"
      className="relative scroll-mt-24 overflow-hidden py-14 sm:py-16"
      aria-label="Gift Finder quiz"
    >
      {/* backdrop */}
      <div className="absolute inset-0 bg-gradient-to-b from-cream via-brand-soft/60 to-cream dark:from-background dark:via-rose-950/30 dark:to-background" aria-hidden />
      <div className="absolute inset-0 bg-dotted opacity-50" aria-hidden />

      <div className="relative mx-auto max-w-3xl px-4 md:px-8">
        {/* heading */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 dark:border-stone-700 bg-white/80 dark:bg-card/80 px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-[0.14em] text-brand dark:text-rose-400 shadow-soft backdrop-blur">
            <Wand2 className="h-3.5 w-3.5" aria-hidden /> Gift Finder
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
            Never gift the{" "}
            <span className="text-gradient-brand">wrong thing</span> again
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm font-medium text-stone-500 dark:text-stone-400 sm:text-base">
            Three taps and our gift concierge hand-picks the shortlist for you.
          </p>
        </motion.div>

        {/* wizard card */}
        <motion.div
          initial={{ opacity: 0, y: 26, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ type: "spring", stiffness: 200, damping: 24, delay: 0.1 }}
          className="glass mt-8 overflow-hidden rounded-[2rem] border border-rose-100 dark:border-stone-800 shadow-lift"
        >
          {/* progress header */}
          <div className="flex items-center gap-3 border-b border-rose-100/70 dark:border-stone-800/70 bg-white/70 dark:bg-card/70 px-5 py-3.5 backdrop-blur">
            {step > 0 && step < 3 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={back}
                className="grid h-8 w-8 place-items-center rounded-full bg-cream dark:bg-muted text-charcoal dark:text-foreground transition hover:bg-rose-100 dark:hover:bg-rose-950/40 hover:text-brand dark:hover:text-rose-400"
                aria-label="Go back a step"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden />
              </motion.button>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-stone-400">
                {step < 3 ? `Step ${step + 1} of 3` : "Your matches"}
              </p>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-rose-100 dark:bg-stone-800">
                <motion.div
                  className="h-full rounded-full bg-gradient-brand"
                  animate={{ width: `${progress}%` }}
                  transition={{ type: "spring", stiffness: 160, damping: 26 }}
                />
              </div>
            </div>
            <motion.span
              animate={{ rotate: [0, 12, -8, 0] }}
              transition={{ repeat: Infinity, duration: 3.2, ease: "easeInOut" }}
              className="hidden sm:block"
              aria-hidden
            >
              <Wand2 className="h-5 w-5 text-brand" />
            </motion.span>
          </div>

          {/* body */}
          <div className="relative min-h-[380px] px-5 py-6 sm:min-h-[400px] sm:px-8">
            <AnimatePresence mode="wait" custom={dir}>
              {/* -------- question steps -------- */}
              {step < 3 && (
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: dir * 64 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: dir * -64 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  <h3 className="text-center text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
                    {STEPS[step].title}
                  </h3>
                  <p className="mt-1 text-center text-sm font-medium text-stone-500 dark:text-stone-400">
                    {STEPS[step].sub}
                  </p>

                  <div
                    className={cn(
                      "mt-6 grid gap-3",
                      step === 2 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3"
                    )}
                  >
                    {optionSets[step].map((opt, i) => {
                      const selected = answers[STEPS[step].key]?.id === opt.id;
                      return (
                        <motion.button
                          key={opt.id}
                          initial={{ opacity: 0, y: 16, scale: 0.96 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: 0.06 + i * 0.05, type: "spring", stiffness: 320, damping: 24 }}
                          whileHover={{ y: -4, scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => choose(opt)}
                          aria-pressed={selected}
                          className={cn(
                            "relative flex flex-col items-center gap-1.5 rounded-2xl border-2 px-3 py-4 transition-colors",
                            selected
                              ? "border-brand bg-brand text-white shadow-lift"
                              : "border-rose-100 dark:border-stone-800 bg-white dark:bg-card text-charcoal dark:text-foreground shadow-soft hover:border-rose-300 dark:hover:border-stone-600"
                          )}
                        >
                          {selected && (
                            <motion.span
                              layoutId="finder-selected-glow"
                              className="absolute inset-0 rounded-2xl ring-4 ring-rose-200 dark:ring-stone-700"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          <motion.span
                            className="relative text-2xl"
                            animate={selected ? { scale: [1, 1.3, 1], rotate: [0, -8, 8, 0] } : {}}
                            transition={{ duration: 0.45 }}
                          >
                            {opt.emoji}
                          </motion.span>
                          <span className="relative text-xs font-extrabold sm:text-sm">
                            {opt.label}
                          </span>
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* -------- loading -------- */}
              {step === 3 && loading && (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex min-h-[320px] flex-col items-center justify-center gap-4"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.6, ease: "linear" }}
                    className="grid h-16 w-16 place-items-center rounded-full border-4 border-rose-100 dark:border-stone-800 border-t-brand"
                    aria-hidden
                  />
                  <p className="text-sm font-extrabold text-foreground">
                    Consulting our gift concierge…
                  </p>
                  <div className="flex gap-1.5">
                    {[chip.length % 3, 1, 2].map((_, i) => (
                      <motion.span
                        key={i}
                        animate={{ opacity: [0.25, 1, 0.25] }}
                        transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.18 }}
                        className="h-1.5 w-1.5 rounded-full bg-brand"
                      />
                    ))}
                  </div>
                </motion.div>
              )}

              {/* -------- results -------- */}
              {step === 3 && !loading && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 240, damping: 26 }}
                >
                  <div className="text-center">
                    <motion.h3
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 18 }}
                      className="text-xl font-extrabold tracking-tight text-foreground sm:text-2xl"
                    >
                      ✨ Hand-picked for {answers.recipient?.label}
                    </motion.h3>
                    <p className="mt-1 inline-flex flex-wrap items-center justify-center gap-1.5 text-xs font-bold text-stone-500 dark:text-stone-400">
                      <span className="rounded-full bg-brand-soft dark:bg-rose-950/50 px-2.5 py-1 text-brand dark:text-rose-300">
                        {chip}
                      </span>
                    </p>
                  </div>

                  {picks.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 py-10 text-center">
                      <Sparkles className="h-8 w-8 text-gold" aria-hidden />
                      <p className="text-sm font-bold text-foreground">
                        Our concierge is stumped — try another combo!
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                        {picks.map((p, i) => (
                          <MatchCard key={p.id} product={p} index={i} onAdd={addOne} />
                        ))}
                      </div>

                      <div className="mt-6 flex flex-col items-center gap-3">
                        <motion.button
                          whileHover={{ scale: 1.04, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={addAll}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-extrabold text-white shadow-lift transition-colors",
                            addedAll ? "bg-mint" : "bg-brand hover:bg-rose-700"
                          )}
                        >
                          {addedAll ? (
                            <>
                              <Check className="h-4 w-4" aria-hidden /> All {picks.length} in the bag!
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="h-4 w-4" aria-hidden />
                              Add all to bag · {formatINR(total)}
                            </>
                          )}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.03 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={retake}
                          className="inline-flex items-center gap-1.5 text-xs font-extrabold text-stone-400 transition-colors hover:text-brand dark:hover:text-rose-400"
                        >
                          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
                          Retake the quiz
                        </motion.button>
                      </div>
                    </>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* reassurance strip */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-[11px] font-bold text-stone-400"
        >
          <span className="flex items-center gap-1">
            <ArrowRight className="h-3 w-3 text-brand" aria-hidden /> Curated by humans, boosted by data
          </span>
          <span className="flex items-center gap-1">
            <Zap className="h-3 w-3 text-brand" aria-hidden /> Same-day eligible picks flagged
          </span>
        </motion.p>
      </div>
    </section>
  );
}
