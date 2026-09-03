"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import {
  ArrowRight,
  Check,
  Gift,
  Heart,
  Minus,
  PenLine,
  Plus,
  Sparkles,
  X,
} from "lucide-react";
import { Lottie } from "lottie-react";
import celebrationAnim from "@/lib/lottie/celebration.json";
import { useToast } from "@/hooks/use-toast";
import { petalConfetti } from "@/lib/confetti";
import { formatINR } from "@/lib/format";
import { useShopStore } from "@/lib/store";
import type { Product } from "@/lib/types";
import { r2ProductUrl } from "@/lib/media";

/* ------------------------------ constants ------------------------------ */

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;

type MainType = "cakes" | "flowers";

type AddOn = { id: string; name: string; price: number; image: string | null };

const MAIN_TYPES: { id: MainType; label: string }[] = [
  { id: "cakes", label: "Cakes 🍰" },
  { id: "flowers", label: "Flowers 🌸" },
];

const ADD_ONS: AddOn[] = [
  { id: "teddy", name: "Cuddle Teddy", price: 349, image: r2ProductUrl("teddy.jpg") },
  { id: "choco", name: "Chocolate Box", price: 499, image: r2ProductUrl("choco.jpg") },
  { id: "mug", name: "Photo Mug", price: 399, image: r2ProductUrl("mug.jpg") },
  { id: "card", name: "Handmade Card", price: 149, image: null },
];

const STEPS = [
  { id: 1, label: "Main Gift", icon: Gift },
  { id: 2, label: "Add-ons", icon: Sparkles },
  { id: 3, label: "Personal Touch", icon: PenLine },
] as const;

const SLOTS = [
  { id: "same-day", label: "Same Day 🚀" },
  { id: "midnight", label: "Midnight 🌙" },
  { id: "standard", label: "Standard 📦" },
] as const;

type SlotId = (typeof SLOTS)[number]["id"];

const MESSAGE_IDEAS = [
  "Some people make the world softer just by being in it — that's you. 💖",
  "Another year of you being absolutely wonderful. Celebrate loudly! 🎉",
  "Roses are red, cake is sweet — this little combo is yours to eat! 🌹🍰",
  "Thinking of you a little extra today. Hope this makes you smile. 😊",
  "You deserve every petal, every sprinkle, every sweet bite. Enjoy! 🌸",
];

const MAX_MESSAGE = 280;
const MAX_QTY = 2;

/* ---------------------------- rolling number ---------------------------- */

function RollingNumber({ value, className }: { value: number; className?: string }) {
  const raw = useMotionValue(value);
  const spring = useSpring(raw, { stiffness: 90, damping: 20 });
  const display = useTransform(spring, (v: number) => formatINR(Math.round(v)));

  useEffect(() => {
    raw.set(value);
  }, [raw, value]);

  return <motion.span className={className}>{display}</motion.span>;
}

/* ------------------------------ component ------------------------------ */

export default function ComboBuilder() {
  const { toast } = useToast();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [mainType, setMainType] = useState<MainType | null>(null);
  const [mainProduct, setMainProduct] = useState<Product | null>(null);
  const [products, setProducts] = useState<{ cakes: Product[]; flowers: Product[] }>({
    cakes: [],
    flowers: [],
  });
  const [loading, setLoading] = useState(true);
  const [addonQty, setAddonQty] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [slot, setSlot] = useState<SlotId>("same-day");
  const [shakeCount, setShakeCount] = useState(0);
  const [showSuccess, setShowSuccess] = useState(false);
  const addingRef = useRef(false);
  const ideaIdxRef = useRef(-1);

  /* fetch both main-gift categories on mount */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [cakesRes, flowersRes] = await Promise.all([
          fetch("/api/products?category=cakes&limit=4"),
          fetch("/api/products?category=flowers&limit=4"),
        ]);
        const cakes = (await cakesRes.json()) as { products: Product[] };
        const flowers = (await flowersRes.json()) as { products: Product[] };
        if (!cancelled) {
          setProducts({ cakes: cakes.products ?? [], flowers: flowers.products ?? [] });
        }
      } catch {
        /* keep empty lists — empty state renders */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /* auto-dismiss success overlay */
  useEffect(() => {
    if (!showSuccess) return;
    const t = setTimeout(() => {
      addingRef.current = false;
      setShowSuccess(false);
    }, 4000);
    return () => clearTimeout(t);
  }, [showSuccess]);

  const selectedAddons = ADD_ONS.filter((a) => (addonQty[a.id] ?? 0) > 0).map((a) => ({
    addon: a,
    qty: addonQty[a.id] ?? 0,
  }));
  const addonUnits = ADD_ONS.reduce((n, a) => n + (addonQty[a.id] ?? 0), 0);
  const comboTotal =
    (mainProduct?.price ?? 0) +
    ADD_ONS.reduce((sum, a) => sum + (addonQty[a.id] ?? 0) * a.price, 0);
  const slotLabel = SLOTS.find((s) => s.id === slot)?.label ?? "";
  const progress = ((step - 1) / 2) * 100;
  const canProceed = step !== 1 || mainProduct !== null;

  /* ------------------------------ handlers ------------------------------ */

  const goToStep = (target: 1 | 2 | 3) => {
    if (target < step) setStep(target);
  };

  const handleType = (type: MainType) => {
    setMainType(type);
    setMainProduct(null); // switching type resets the main pick
  };

  const toggleAddon = (id: string) => {
    setAddonQty((prev) => ({ ...prev, [id]: (prev[id] ?? 0) > 0 ? 0 : 1 }));
  };

  const changeAddonQty = (id: string, next: number) => {
    setAddonQty((prev) => ({ ...prev, [id]: Math.min(MAX_QTY, Math.max(0, next)) }));
  };

  const fillSuggestion = () => {
    let idx = Math.floor(Math.random() * MESSAGE_IDEAS.length);
    if (idx === ideaIdxRef.current) idx = (idx + 1) % MESSAGE_IDEAS.length;
    ideaIdxRef.current = idx;
    setMessage(MESSAGE_IDEAS[idx]);
  };

  const handleNext = () => {
    if (step === 1 && !mainProduct) {
      setShakeCount((c) => c + 1); // shake instead of proceeding
      return;
    }
    if (step < 3) {
      setStep((step + 1) as 1 | 2 | 3);
    } else {
      handleAdd();
    }
  };

  const handleAdd = () => {
    if (!mainProduct || addingRef.current) return;
    addingRef.current = true;

    const n = addonUnits;
    const total = comboTotal;
    useShopStore.getState().addToCart(
      {
        id: `combo-${Date.now()}`,
        name:
          n > 0
            ? `Custom Combo (${mainProduct.name} + ${n} add-on${n === 1 ? "" : "s"})`
            : `Custom Combo (${mainProduct.name})`,
        price: total,
        image: mainProduct.image,
        category: "combos",
      },
      1
    );

    petalConfetti();
    toast({
      title: "Combo added to your gift bag! 🎉",
      description: `Total ${formatINR(total)}`,
    });
    setShowSuccess(true);
  };

  const resetAll = () => {
    addingRef.current = false;
    setShowSuccess(false);
    setStep(1);
    setMainType(null);
    setMainProduct(null);
    setAddonQty({});
    setMessage("");
    setSlot("same-day");
  };

  /* ------------------------------- render ------------------------------- */

  return (
    <section
      id="combo-builder"
      className="relative scroll-mt-24 overflow-hidden bg-charcoal py-16 text-cream md:py-24"
    >
      {/* decorative blobs */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-8 h-96 w-96 rounded-full bg-brand opacity-20 blur-3xl"
        animate={{ y: [0, -24, 0], x: [0, 16, 0] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-8 h-96 w-96 rounded-full bg-gold opacity-20 blur-3xl"
        animate={{ y: [0, 24, 0], x: [0, -16, 0] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dotted opacity-40" />

      <div className="relative mx-auto max-w-6xl px-4 md:px-8">
        {/* header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/10 px-4 py-1.5 text-xs font-semibold tracking-wider text-gold">
            🎀 Build-your-own
          </span>
          <h2 className="mt-4 font-extrabold tracking-tight text-3xl text-white md:text-5xl">
            Craft your <span className="text-gradient-brand">perfect combo</span>
          </h2>
          <p className="mt-3 text-sm text-stone-300 md:text-base">
            Mix a main gift with adorable add-ons and watch the savings roll in.
          </p>
        </div>

        {/* stepper */}
        <ol
          aria-label="Combo builder steps"
          className="mx-auto mt-10 flex max-w-2xl items-center gap-2 md:gap-3"
        >
          {STEPS.map((s, i) => {
            const done = s.id < step;
            const current = s.id === step;
            const Icon = s.icon;
            return (
              <Fragment key={s.id}>
                {i > 0 && (
                  <li aria-hidden className="flex-1">
                    <div className="h-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full bg-gradient-brand"
                        initial={false}
                        animate={{ width: `${progress}%` }}
                        transition={SPRING}
                      />
                    </div>
                  </li>
                )}
                <li>
                  <button
                    type="button"
                    onClick={() => goToStep(s.id)}
                    disabled={s.id > step}
                    aria-current={current ? "step" : undefined}
                    className="group flex items-center gap-2 disabled:cursor-default"
                  >
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors md:h-10 md:w-10 ${
                        done
                          ? "bg-mint text-white"
                          : current
                            ? "bg-gold text-charcoal animate-pulse-glow"
                            : "bg-white/10 text-stone-400"
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                    </span>
                    <span
                      className={`flex flex-col items-start leading-tight ${
                        done ? "text-mint" : current ? "text-cream" : "text-stone-500"
                      }`}
                    >
                      <span className="text-[9px] font-bold uppercase tracking-widest opacity-70">
                        Step {s.id}
                      </span>
                      <span className="text-[11px] font-semibold md:text-sm">{s.label}</span>
                    </span>
                  </button>
                </li>
              </Fragment>
            );
          })}
        </ol>

        {/* content area */}
        <div className="relative mt-8 min-h-[420px] md:mt-12">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={SPRING}
            >
              {/* ------------------------- STEP 1 ------------------------- */}
              {step === 1 && (
                <div>
                  <p className="mb-4 text-sm font-medium text-stone-400">
                    Pick the hero of your combo 🌟
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {MAIN_TYPES.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => handleType(t.id)}
                        aria-pressed={mainType === t.id}
                        className={`rounded-full px-4 py-2 text-sm font-semibold ring-1 transition-colors ${
                          mainType === t.id
                            ? "bg-brand text-white ring-brand"
                            : "bg-white/10 text-cream ring-white/10 hover:bg-white/20"
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {loading ? (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="animate-pulse">
                          <div className="aspect-square rounded-2xl bg-white/10" />
                          <div className="mt-2 h-3.5 w-3/4 rounded bg-white/10" />
                          <div className="mt-1.5 h-3 w-1/2 rounded bg-white/10" />
                        </div>
                      ))}
                    </div>
                  ) : mainType === null ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-stone-400">
                      Choose Cakes 🍰 or Flowers 🌸 to see today&apos;s hand-picked gifts.
                    </div>
                  ) : (products[mainType] ?? []).length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/15 bg-white/5 px-6 py-10 text-center text-sm text-stone-400">
                      Couldn&apos;t load gifts right now — please refresh.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                      {products[mainType].map((p) => {
                        const selected = mainProduct?.id === p.id;
                        return (
                          <motion.button
                            key={p.id}
                            type="button"
                            onClick={() => setMainProduct(p)}
                            aria-pressed={selected}
                            aria-label={`${p.name}, ${formatINR(p.price)}`}
                            whileHover={{ y: -4 }}
                            whileTap={{ scale: 0.97 }}
                            animate={{ scale: selected ? 1.03 : 1 }}
                            transition={SPRING}
                            className="group text-left"
                          >
                            <div
                              className={`relative aspect-square overflow-hidden rounded-2xl transition-shadow ${
                                selected
                                  ? "ring-2 ring-gold ring-offset-2 ring-offset-charcoal"
                                  : "ring-1 ring-white/10 group-hover:ring-white/25"
                              }`}
                            >
                              <Image
                                src={p.image}
                                alt={p.name}
                                fill
                                sizes="(min-width: 768px) 25vw, 50vw"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                              <AnimatePresence>
                                {selected && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                    className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-gold text-charcoal shadow-lift"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm font-semibold text-cream">
                              {p.name}
                            </p>
                            <p className="mt-0.5">
                              <span className="text-sm font-bold text-gold">
                                {formatINR(p.price)}
                              </span>{" "}
                              <span className="text-xs text-stone-400 line-through">
                                {formatINR(p.mrp)}
                              </span>
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ------------------------- STEP 2 ------------------------- */}
              {step === 2 && (
                <div>
                  {/* tray */}
                  <div className="mb-5 rounded-2xl border border-white/10 bg-white/5 p-3 md:p-4">
                    <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                      Your combo so far
                    </p>
                    <div className="flex flex-wrap items-center gap-2">
                      {mainProduct && (
                        <motion.span
                          layout
                          initial={false}
                          className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold ring-1 ring-gold/30"
                        >
                          <Gift className="h-3 w-3" /> {mainProduct.name}
                        </motion.span>
                      )}
                      <AnimatePresence mode="popLayout" initial={false}>
                        {selectedAddons.map(({ addon, qty }) => (
                          <motion.span
                            layout
                            key={addon.id}
                            initial={{ opacity: 0, scale: 0.7 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.7 }}
                            transition={SPRING}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-cream"
                          >
                            {addon.name} ×{qty}
                            <button
                              type="button"
                              onClick={() => changeAddonQty(addon.id, 0)}
                              aria-label={`Remove ${addon.name} from combo`}
                              className="rounded-full p-0.5 text-stone-400 transition-colors hover:bg-white/10 hover:text-cream"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </motion.span>
                        ))}
                      </AnimatePresence>
                      {selectedAddons.length === 0 && (
                        <span className="text-xs text-stone-500">
                          No add-ons yet — tap a card below 🎁
                        </span>
                      )}
                    </div>
                  </div>

                  {/* add-on grid */}
                  <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                    {ADD_ONS.map((a) => {
                      const qty = addonQty[a.id] ?? 0;
                      const selected = qty > 0;
                      return (
                        <motion.div
                          layout
                          key={a.id}
                          whileTap={{ scale: 0.92 }}
                          transition={SPRING}
                          className={`rounded-2xl p-2.5 transition-shadow md:p-3 ${
                            selected
                              ? "bg-brand/10 ring-2 ring-brand shadow-[0_0_28px_-8px_rgba(244,63,94,0.55)]"
                              : "bg-white/5 ring-1 ring-white/10 hover:bg-white/10"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => toggleAddon(a.id)}
                            aria-pressed={selected}
                            aria-label={`${selected ? "Remove" : "Add"} ${a.name}`}
                            className="w-full text-left"
                          >
                            <div
                              className={`relative aspect-square overflow-hidden rounded-xl ${
                                a.image ? "" : "bg-gradient-brand"
                              }`}
                            >
                              {a.image ? (
                                <Image
                                  src={a.image}
                                  alt={a.name}
                                  fill
                                  sizes="(min-width: 768px) 25vw, 50vw"
                                  className="object-cover"
                                />
                              ) : (
                                <span className="flex h-full items-center justify-center">
                                  <Heart className="h-10 w-10 text-white" fill="currentColor" />
                                </span>
                              )}
                              <AnimatePresence>
                                {selected && (
                                  <motion.span
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    exit={{ scale: 0 }}
                                    transition={{ type: "spring", stiffness: 500, damping: 18 }}
                                    className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white shadow-lift"
                                  >
                                    <Check className="h-3 w-3" />
                                  </motion.span>
                                )}
                              </AnimatePresence>
                            </div>
                            <p className="mt-2 line-clamp-1 text-sm font-semibold text-cream">
                              {a.name}
                            </p>
                            <p className="text-sm font-bold text-gold">{formatINR(a.price)}</p>
                          </button>

                          <AnimatePresence initial={false}>
                            {selected && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.25, ease: "easeInOut" }}
                                className="overflow-hidden"
                              >
                                <div className="mt-2 flex items-center justify-between rounded-xl border border-white/10 bg-charcoal/60 p-1">
                                  <button
                                    type="button"
                                    onClick={() => changeAddonQty(a.id, qty - 1)}
                                    aria-label={`Decrease ${a.name} quantity`}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-white/10 hover:text-cream"
                                  >
                                    <Minus className="h-3.5 w-3.5" />
                                  </button>
                                  <span className="text-sm font-bold tabular-nums text-cream">
                                    {qty}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => changeAddonQty(a.id, qty + 1)}
                                    disabled={qty >= MAX_QTY}
                                    aria-label={`Increase ${a.name} quantity`}
                                    className="flex h-6 w-6 items-center justify-center rounded-lg text-stone-300 transition-colors hover:bg-white/10 hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ------------------------- STEP 3 ------------------------- */}
              {step === 3 && (
                <div className="grid gap-5 md:grid-cols-2">
                  <div>
                    <p className="mb-4 text-sm font-medium text-stone-400">
                      Make it theirs ✍️
                    </p>
                    <label
                      htmlFor="combo-message"
                      className="mb-2 block text-xs font-bold uppercase tracking-widest text-stone-400"
                    >
                      Gift message
                    </label>
                    <textarea
                      id="combo-message"
                      value={message}
                      maxLength={MAX_MESSAGE}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Write something sweet… it goes on the card 💌"
                      rows={4}
                      className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-cream placeholder:text-stone-500 transition-colors outline-none focus:border-gold/50 focus:ring-2 focus:ring-gold/25"
                    />
                    <div className="mt-2 flex items-center justify-between">
                      <button
                        type="button"
                        onClick={fillSuggestion}
                        className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-gold ring-1 ring-white/10 transition-colors hover:bg-white/20"
                      >
                        Need words? ✨
                      </button>
                      <span className="text-xs text-stone-500">
                        <motion.span
                          key={message.length}
                          initial={{ scale: 1.35 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 500, damping: 18 }}
                          className="inline-block tabular-nums text-stone-300"
                        >
                          {message.length}
                        </motion.span>
                        /{MAX_MESSAGE}
                      </span>
                    </div>

                    <p className="mb-2 mt-6 block text-xs font-bold uppercase tracking-widest text-stone-400">
                      Delivery slot
                    </p>
                    <div className="flex flex-wrap gap-2" role="group" aria-label="Delivery slot">
                      {SLOTS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSlot(s.id)}
                          aria-pressed={slot === s.id}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                            slot === s.id
                              ? "bg-gold text-charcoal"
                              : "bg-white/10 text-cream hover:bg-white/20"
                          }`}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* summary card */}
                  <div className="rounded-3xl border border-white/10 bg-white/5 p-4 md:p-6">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-stone-400">
                      Order summary
                    </h3>
                    <div className="mt-4 space-y-2.5">
                      {mainProduct && (
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="flex min-w-0 items-center gap-2 text-stone-200">
                            <Gift className="h-3.5 w-3.5 shrink-0 text-gold" />
                            <span className="truncate">{mainProduct.name}</span>
                          </span>
                          <span className="shrink-0 font-semibold text-cream">
                            {formatINR(mainProduct.price)}
                          </span>
                        </div>
                      )}
                      {selectedAddons.map(({ addon, qty }) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between gap-3 text-sm"
                        >
                          <span className="truncate text-stone-300">
                            {addon.name} ×{qty}
                          </span>
                          <span className="shrink-0 text-stone-200">
                            {formatINR(addon.price * qty)}
                          </span>
                        </div>
                      ))}
                      {selectedAddons.length === 0 && (
                        <div className="flex items-center justify-between text-sm text-stone-500">
                          <span>No add-ons yet</span>
                          <span>—</span>
                        </div>
                      )}
                    </div>
                    <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                          Combo total
                        </p>
                        <p className="mt-0.5 text-xs text-mint">{slotLabel} delivery</p>
                      </div>
                      <RollingNumber
                        value={comboTotal}
                        className="text-2xl font-extrabold tabular-nums text-gold md:text-3xl"
                      />
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* success overlay */}
          <AnimatePresence>
            {showSuccess && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-30 flex items-center justify-center bg-charcoal/95 backdrop-blur-sm"
                role="status"
              >
                <motion.div
                  initial={{ scale: 0.9, y: 14 }}
                  animate={{ scale: 1, y: 0 }}
                  transition={SPRING}
                  className="flex flex-col items-center p-6 text-center"
                >
                  <Lottie src={celebrationAnim} loop={false} className="h-36 w-36" />
                  <h3 className="mt-2 font-extrabold tracking-tight text-2xl text-white">
                    Combo crafted!
                  </h3>
                  <p className="mt-1 text-sm text-stone-300">
                    Your gift bag just got a whole lot happier.
                  </p>
                  <button
                    type="button"
                    onClick={resetAll}
                    className="mt-5 rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-white shadow-lift transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    Continue crafting
                  </button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* sticky action bar */}
        <div className="sticky bottom-4 z-30 mt-10 md:mt-14">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-charcoal/80 p-3 shadow-lift backdrop-blur">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex flex-col leading-tight">
                <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                  Step {step} of 3
                </span>
                <span className="hidden text-[11px] text-stone-500 sm:block">
                  Live combo total
                </span>
              </div>
              <RollingNumber
                value={comboTotal}
                className="text-xl font-extrabold tabular-nums text-gold md:text-2xl"
              />
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
                disabled={step === 1}
                className="rounded-xl bg-white/5 px-4 py-2.5 text-sm font-semibold text-cream ring-1 ring-white/10 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                aria-disabled={!canProceed}
                aria-label={
                  step === 3 ? "Add combo to cart" : "Continue to next step"
                }
                className={`rounded-xl bg-gradient-brand px-5 py-2.5 font-bold text-white shadow-lift transition-opacity hover:opacity-95 ${
                  canProceed ? "" : "opacity-50"
                }`}
              >
                <motion.span
                  key={shakeCount}
                  animate={shakeCount > 0 ? { x: [0, -8, 8, -4, 4, 0] } : { x: 0 }}
                  transition={{ duration: 0.4 }}
                  className="inline-flex items-center gap-2"
                >
                  {step === 3
                    ? "Add Combo to Cart 🎁"
                    : `Next: ${step === 1 ? "Add-ons" : "Personal Touch"}`}
                  {step !== 3 && <ArrowRight className="h-4 w-4" />}
                </motion.span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
