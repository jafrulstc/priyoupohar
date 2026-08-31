"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ShoppingBag,
  Plus,
  Minus,
  Trash2,
  Truck,
  Gift,
  Lock,
  PartyPopper,
  Loader2,
  ArrowRight,
  TicketPercent,
  BadgeCheck,
  Radar,
  Flower2,
  Ribbon,
  Sparkles,
  Zap,
  MoonStar,
  Package,
  Check,
} from "lucide-react";
import { Lottie } from "lottie-react";
import celebrationAnim from "@/lib/lottie/celebration.json";
import {
  useShopStore,
  cartTotal,
  cartCount,
  FREE_SHIPPING_THRESHOLD,
  LOYALTY_TARGET,
  loyaltyRewardFor,
} from "@/lib/store";
import { resolveCoupon, couponDiscount } from "@/lib/coupons";
import { useMounted } from "@/hooks/use-mounted";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatINR } from "@/lib/format";
import { celebrationConfetti, petalConfetti, miniConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type CheckoutResult = {
  orderId: string;
  total: number;
  etaHours: number;
  deliveryTo: string;
  estimatedDelivery: string;
  coupon: string | null;
  discount: number;
  freeShipping?: boolean;
  premiumWrap?: boolean;
  slot?: string;
};

const SLOTS = [
  { id: "same-day", label: "Same-day", hint: "in ~4 hrs", icon: Zap },
  { id: "midnight", label: "Midnight", hint: "by 12 AM", icon: MoonStar },
  { id: "standard", label: "Standard", hint: "in 2 days", icon: Package },
] as const;

export default function CartDrawer() {
  const isOpen = useShopStore((s) => s.isCartOpen);
  const setOpen = useShopStore((s) => s.setCartOpen);
  const cart = useShopStore((s) => s.cart);
  const updateQty = useShopStore((s) => s.updateQty);
  const removeFromCart = useShopStore((s) => s.removeFromCart);
  const clearCart = useShopStore((s) => s.clearCart);
  const location = useShopStore((s) => s.location);
  const setLocationOpen = useShopStore((s) => s.setLocationOpen);
  const setLastOrderId = useShopStore((s) => s.setLastOrderId);
  const setTrackOpen = useShopStore((s) => s.setTrackOpen);
  /* upsells + loyalty */
  const premiumWrap = useShopStore((s) => s.premiumWrap);
  const setPremiumWrap = useShopStore((s) => s.setPremiumWrap);
  const deliverySlot = useShopStore((s) => s.deliverySlot);
  const setDeliverySlot = useShopStore((s) => s.setDeliverySlot);
  const stamps = useShopStore((s) => s.stamps);
  const rewardCoupon = useShopStore((s) => s.rewardCoupon);
  const recordOrder = useShopStore((s) => s.recordOrder);
  const dismissReward = useShopStore((s) => s.dismissReward);
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const mounted = useMounted();
  const [checkingOut, setCheckingOut] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
  const [unlocked, setUnlocked] = useState<string | null>(null);
  const [couponInput, setCouponInput] = useState("");
  const [coupon, setCoupon] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const appliedCoupon = resolveCoupon(coupon);

  // Free-shipping crossing tracker
  const prevPct = useRef(0);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen, setOpen]);

  const subtotal = mounted ? cartTotal(cart) : 0;
  const count = mounted ? cartCount(cart) : 0;
  const pct = Math.min(100, Math.round((subtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const remaining = FREE_SHIPPING_THRESHOLD - subtotal;
  const freeShipUnlocked = pct >= 100 || appliedCoupon?.kind === "shipping";
  const discount = appliedCoupon ? couponDiscount(appliedCoupon, subtotal) : 0;
  const deliveryFee = pct >= 100 || appliedCoupon?.kind === "shipping" ? 0 : 99;
  const wrapFee = premiumWrap ? 49 : 0;
  const grandTotal = subtotal - discount + deliveryFee + wrapFee;

  /* tiered loyalty: the reward ladder climbs each completed 3-order cycle */
  const ordersCount = useShopStore((s) => s.ordersCount);
  const nextCycle = Math.floor(ordersCount / LOYALTY_TARGET) + 1;
  const nextRewardLabel =
    resolveCoupon(loyaltyRewardFor(nextCycle))?.label ?? "₹100 off";

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    const matched = resolveCoupon(code);
    if (matched) {
      setCoupon(matched.code);
      setCouponError(null);
      toast({
        title: `${matched.code} applied! 🎊`,
        description:
          matched.kind === "shipping"
            ? "Your gifts ride for free."
            : `${matched.label} your gifts — nicely spotted.`,
      });
    } else {
      setCouponError("That code didn’t work — try BLISS10");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      prevPct.current = 0;
      return;
    }
    if (pct >= 100 && prevPct.current < 100 && prevPct.current > 0) {
      petalConfetti();
      toast({ title: "FREE shipping unlocked! 🎉", description: "Your gifts ride for free." });
    }
    prevPct.current = pct;
  }, [pct, isOpen, toast]);

  const checkout = async () => {
    if (cart.length === 0) return;
    if (!location) {
      toast({
        title: "Where are we heading? 📍",
        description: "Pick a delivery city first.",
      });
      setOpen(false);
      setLocationOpen(true);
      return;
    }
    setCheckingOut(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.map((c) => ({ id: c.id, name: c.name, price: c.price, qty: c.qty })),
          location: { city: location.city, pincode: location.pincode },
          slot: deliverySlot,
          coupon: coupon ?? undefined,
          premiumWrap,
        }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const data = await res.json();
      setResult(data);
      setLastOrderId(data.orderId);
      /* loyalty: stamp the card, maybe unlock the reward */
      const unlockedCode = recordOrder({
        id: data.orderId,
        total: data.total,
        at: Date.now(),
        items: count,
      });
      if (unlockedCode) {
        setUnlocked(unlockedCode);
        setTimeout(() => celebrationConfetti(), 650);
        toast({
          title: "Bloom Reward unlocked! 🌸",
          description: `${unlockedCode} — ${resolveCoupon(unlockedCode)?.label ?? "a treat"} on your next order, on us.`,
        });
      }
      celebrationConfetti();
    } catch {
      toast({ title: "Checkout hiccup 😢", description: "Please try again in a moment." });
    } finally {
      setCheckingOut(false);
    }
  };

  const finish = () => {
    clearCart();
    setResult(null);
    setUnlocked(null);
    setPremiumWrap(false);
    setCoupon(null);
    setCouponInput("");
    setCouponError(null);
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[70]" role="dialog" aria-modal="true" aria-label="Gift bag">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm"
          />

          {/* Panel — bottom sheet on mobile (drag to dismiss) · slide-over on desktop */}
          <motion.aside
            initial={isMobile ? { y: "100%" } : { x: "100%" }}
            animate={isMobile ? { y: 0 } : { x: 0 }}
            exit={isMobile ? { y: "100%" } : { x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            drag={isMobile ? "y" : false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) setOpen(false);
            }}
            className={cn(
              "absolute flex w-full flex-col bg-background shadow-2xl",
              isMobile
                ? "inset-x-0 bottom-0 max-h-[88dvh] rounded-t-[1.75rem]"
                : "inset-y-0 right-0 max-w-md"
            )}
          >
            {/* Header */}
            <div className="border-b border-rose-100 bg-card dark:border-stone-800">
              <div className="flex justify-center pt-2 md:hidden" aria-hidden>
                <span className="h-1.5 w-12 rounded-full bg-stone-300 dark:bg-stone-600" />
              </div>
              <div className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300">
                    <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
                  </span>
                  <div>
                    <h2 className="text-base font-extrabold text-foreground">Your Gift Bag</h2>
                    <p className="text-xs text-stone-400">
                      {count} item{count === 1 ? "" : "s"} of joy
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 transition hover:border-rose-300 hover:text-brand dark:border-stone-700"
                  aria-label="Close gift bag"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
            </div>

            {result ? (
              /* ---------- SUCCESS VIEW ---------- */
              <div className="flex flex-1 flex-col items-center justify-center overflow-y-auto px-6 text-center scrollbar-slim">
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                  <Lottie src={celebrationAnim} loop={false} className="h-44 w-44" />
                </motion.div>
                <motion.div
                  initial={{ y: 24, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className="text-xl font-extrabold text-foreground">Order confirmed! 🎉</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Order <span className="font-mono font-bold text-brand">{result.orderId}</span> is
                    being wrapped with love.
                  </p>
                  <div className="mt-4 w-full space-y-2 rounded-2xl border border-rose-100 bg-card p-4 text-left text-sm shadow-soft dark:border-stone-800">
                    {unlocked && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", stiffness: 300, damping: 18 }}
                        className="flex flex-col gap-0.5 rounded-xl bg-gold-soft px-3 py-2 dark:bg-amber-950/40"
                      >
                        <span className="flex items-center gap-1.5 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                          <Flower2 className="h-4 w-4" aria-hidden />
                          Reward earned · {unlocked}
                        </span>
                        <span className="text-[11px] font-bold text-amber-700/90 dark:text-amber-300/90">
                          {resolveCoupon(unlocked)?.label ?? "₹100 off"} on your next order
                        </span>
                      </motion.div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-500">Paid</span>
                      <span className="font-extrabold text-foreground">{formatINR(result.total)}</span>
                    </div>
                    {result.coupon && result.discount > 0 && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-mint">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          {result.coupon} saved
                        </span>
                        <span className="font-bold text-mint">−{formatINR(result.discount)}</span>
                      </div>
                    )}
                    {result.coupon && result.freeShipping && (
                      <div className="flex justify-between">
                        <span className="flex items-center gap-1 text-mint">
                          <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
                          {result.coupon} · free shipping
                        </span>
                        <span className="font-bold text-mint">−{formatINR(99)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-stone-500">Delivering to</span>
                      <span className="font-bold text-foreground">{result.deliveryTo}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Slot</span>
                      <span className="font-bold capitalize text-foreground">
                        {result.slot?.replace("-", "·") ?? "Same·day"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">Gift wrap</span>
                      <span className="font-bold text-foreground">
                        {result.premiumWrap ? "Premium velvet 🎀" : "Free classic 🎁"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">ETA</span>
                      <span className="font-bold text-mint">~{result.etaHours} hrs 🚀</span>
                    </div>
                  </div>
                  <div className="mt-5 flex w-full gap-2">
                    <button
                      onClick={finish}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-brand px-5 py-3 text-sm font-bold text-white shadow-lift transition hover:opacity-90"
                    >
                      Keep shopping <ArrowRight className="h-4 w-4" aria-hidden />
                    </button>
                    <motion.button
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        setOpen(false);
                        setTrackOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-foreground transition hover:border-brand hover:text-brand dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
                    >
                      <Radar className="h-4 w-4 text-brand" aria-hidden />
                      Track
                    </motion.button>
                  </div>
                </motion.div>
              </div>
            ) : cart.length === 0 ? (
              /* ---------- EMPTY VIEW ---------- */
              <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                <motion.div
                  animate={{ y: [0, -10, 0], rotate: [0, -4, 4, 0] }}
                  transition={{ repeat: Infinity, duration: 3.2 }}
                  className="grid h-24 w-24 place-items-center rounded-full bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300"
                >
                  <Gift className="h-10 w-10" aria-hidden />
                </motion.div>
                <h3 className="text-lg font-extrabold text-foreground">Your bag is feeling light</h3>
                <p className="max-w-60 text-sm text-stone-500">
                  Fill it with flowers, cakes & surprises — happiness ships free over{" "}
                  {formatINR(FREE_SHIPPING_THRESHOLD)}.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-rose-700"
                >
                  Browse bestsellers
                </button>
              </div>
            ) : (
              <>
                {/* ---------- BLOOM REWARDS ---------- */}
                <div className="border-b border-rose-100 bg-card px-5 py-3 dark:border-stone-800">
                  <div className="flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-rose-50 via-pink-50 to-amber-50 px-3.5 py-2.5 ring-1 ring-rose-100 dark:from-rose-950/40 dark:via-stone-900 dark:to-amber-950/30 dark:ring-stone-700/80">
                    <div className="flex items-center gap-2.5">
                      <motion.span
                        animate={{ rotate: [0, -8, 8, 0] }}
                        transition={{ repeat: Infinity, duration: 3.4, ease: "easeInOut" }}
                        className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-brand text-white shadow-soft"
                        aria-hidden
                      >
                        <Flower2 className="h-4 w-4" />
                      </motion.span>
                      <div>
                        <p className="text-xs font-extrabold text-foreground">
                          Bloom Rewards{" "}
                          <span className="ml-0.5 rounded-full bg-brand-soft px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-brand dark:bg-rose-950/50 dark:text-rose-300">
                            {stamps}/{LOYALTY_TARGET} stamps
                          </span>
                        </p>
                        <p className="text-[10px] font-semibold text-stone-400">
                          {stamps > 0
                            ? `${LOYALTY_TARGET - stamps} more order${LOYALTY_TARGET - stamps === 1 ? "" : "s"} → ${nextRewardLabel}`
                            : `Every ${LOYALTY_TARGET}rd order earns ${nextRewardLabel}`}
                        </p>
                      </div>
                    </div>
                    <span className="flex items-center gap-1" aria-hidden>
                      {Array.from({ length: LOYALTY_TARGET }).map((_, i) => (
                        <motion.span
                          key={i}
                          initial={false}
                          animate={
                            i < stamps
                              ? { scale: [1, 1.35, 1], rotate: [0, 18, 0] }
                              : { scale: 1 }
                          }
                          transition={{ duration: 0.45, delay: i * 0.12 }}
                        >
                          <Flower2
                            className={cn(
                              "h-4.5 w-4.5",
                              i < stamps ? "fill-brand text-brand" : "text-rose-200 dark:text-rose-800"
                            )}
                          />
                        </motion.span>
                      ))}
                    </span>
                  </div>
                  {rewardCoupon && !coupon && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 flex items-center justify-between rounded-2xl border border-dashed border-gold bg-gold-soft/70 px-3.5 py-2 dark:bg-amber-950/30"
                    >
                      <span className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-700 dark:text-amber-300">
                        <Sparkles className="h-3.5 w-3.5" aria-hidden />
                        Your reward · {rewardCoupon}
                      </span>
                      <span className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setCoupon(rewardCoupon);
                            setCouponInput(rewardCoupon);
                            miniConfetti();
                            toast({
                              title: "Reward applied! 🌸",
                              description: `${rewardCoupon} · ${resolveCoupon(rewardCoupon)?.label ?? "applied"} this order.`,
                            });
                          }}
                          className="rounded-full bg-charcoal px-3 py-1 text-[10px] font-extrabold text-cream transition hover:bg-stone-700"
                        >
                          Apply
                        </button>
                        <button
                          onClick={dismissReward}
                          aria-label="Dismiss reward"
                          className="text-stone-400 transition hover:text-brand"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    </motion.div>
                  )}
                </div>

                {/* ---------- FREE SHIPPING PROGRESS ---------- */}
                <div className="border-b border-rose-100 bg-card px-5 py-3.5 dark:border-stone-800">
                  <div className="mb-1.5 flex items-center gap-2 text-xs font-bold">
                    <Truck
                      className={cn("h-4 w-4", pct >= 100 ? "text-mint" : "text-brand")}
                      aria-hidden
                    />
                    {pct >= 100 ? (
                      <span className="text-mint">
                        Yay! You&apos;ve unlocked FREE shipping 🎉
                      </span>
                    ) : (
                      <span className="text-foreground">
                        Add {formatINR(remaining)} more for{" "}
                        <span className="text-brand">FREE shipping</span>
                      </span>
                    )}
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-rose-100 dark:bg-stone-800">
                    <motion.div
                      className={cn(
                        "relative h-full rounded-full",
                        pct >= 100 ? "bg-mint" : "bg-gradient-brand"
                      )}
                      initial={false}
                      animate={{ width: `${pct}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 20 }}
                    >
                      <span className="absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 translate-x-1/2 rounded-full border-2 border-white bg-gold shadow-soft" aria-hidden />
                    </motion.div>
                  </div>
                </div>

                {/* ---------- ITEMS ---------- */}
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scrollbar-slim">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {cart.map((item) => (
                      <motion.article
                        layout
                        key={item.id}
                        initial={{ opacity: 0, x: 60 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 28 }}
                        className="flex gap-3 rounded-2xl border border-rose-100 bg-card p-3 shadow-soft dark:border-stone-800"
                      >
                        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="line-clamp-2 text-sm font-bold text-foreground">
                              {item.name}
                            </h4>
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="text-stone-300 transition hover:text-brand"
                              aria-label={`Remove ${item.name}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                          <p className="mt-0.5 text-xs font-semibold text-brand">
                            {formatINR(item.price)}
                          </p>
                          <div className="mt-auto flex items-center justify-between pt-2">
                            <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-cream p-0.5 dark:border-stone-700 dark:bg-stone-800">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="grid h-6.5 w-6.5 place-items-center rounded-full text-stone-500 transition hover:bg-rose-100 hover:text-brand"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-extrabold text-foreground">
                                {item.qty}
                              </span>
                              <button
                                onClick={() => updateQty(item.id, 1)}
                                className="grid h-6.5 w-6.5 place-items-center rounded-full text-stone-500 transition hover:bg-rose-100 hover:text-brand"
                                aria-label={`Increase quantity of ${item.name}`}
                              >
                                <Plus className="h-3.5 w-3.5" />
                              </button>
                            </div>
                            <span className="text-sm font-extrabold text-foreground">
                              {formatINR(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-xs font-semibold text-amber-700 dark:bg-amber-950/40 dark:text-amber-300">
                    <Gift className="h-4 w-4 shrink-0" aria-hidden />
                    Every order ships with a free gift wrap & message card.
                  </div>

                  {/* ---------- DELIVERY SLOT ---------- */}
                  <div className="rounded-2xl border border-rose-100 bg-card p-3.5 shadow-soft dark:border-stone-800">
                    <p className="text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                      Delivery slot
                    </p>
                    <div className="mt-2 grid grid-cols-3 gap-1.5">
                      {SLOTS.map((slot) => {
                        const active = deliverySlot === slot.id;
                        const Icon = slot.icon;
                        return (
                          <button
                            key={slot.id}
                            onClick={() => setDeliverySlot(slot.id)}
                            aria-pressed={active}
                            className={cn(
                              "relative flex flex-col items-center gap-0.5 rounded-xl px-1 py-2 text-center transition",
                              active
                                ? "bg-brand text-white shadow-soft"
                                : "bg-cream text-stone-500 hover:bg-rose-50 hover:text-foreground dark:bg-stone-800 dark:text-stone-400 dark:hover:bg-stone-700"
                            )}
                          >
                            <Icon className="h-4 w-4" aria-hidden />
                            <span className="text-[11px] font-extrabold leading-none">{slot.label}</span>
                            <span
                              className={cn(
                                "text-[9px] font-semibold leading-none",
                                active ? "text-white/75" : "text-stone-400"
                              )}
                            >
                              {slot.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ---------- PREMIUM WRAP UPSELL ---------- */}
                  <motion.div
                    animate={premiumWrap ? { scale: [1, 1.01, 1] } : {}}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 border-dashed p-3.5 transition-colors",
                      premiumWrap
                        ? "border-gold bg-gold-soft/50 dark:bg-amber-950/30"
                        : "border-rose-200 bg-card dark:border-stone-700"
                    )}
                  >
                    <motion.span
                      animate={premiumWrap ? { rotate: [0, -12, 12, 0] } : {}}
                      transition={{ duration: 0.6 }}
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                        premiumWrap ? "bg-gold text-white" : "bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300"
                      )}
                      aria-hidden
                    >
                      <Ribbon className="h-4.5 w-4.5" />
                    </motion.span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-extrabold text-foreground">
                        Premium velvet wrap
                        <span className="ml-1.5 rounded-full bg-gold-soft px-1.5 py-0.5 text-[9px] font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                          +{formatINR(49)}
                        </span>
                      </p>
                      <p className="text-[10px] font-semibold text-stone-400">
                        Satin ribbon, velvet box & handwritten card — basic wrap stays free.
                      </p>
                    </div>
                    <button
                      role="switch"
                      aria-checked={premiumWrap}
                      aria-label="Toggle premium velvet gift wrap"
                      onClick={() => setPremiumWrap(!premiumWrap)}
                      className={cn(
                        "relative h-6 w-11 shrink-0 rounded-full transition-colors",
                        premiumWrap ? "bg-gold" : "bg-stone-200 dark:bg-stone-700"
                      )}
                    >
                      <motion.span
                        layout
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        className={cn(
                          "absolute top-0.5 grid h-5 w-5 place-items-center rounded-full bg-white shadow-soft",
                          premiumWrap ? "right-0.5" : "left-0.5"
                        )}
                      >
                        {premiumWrap && <Check className="h-3 w-3 text-gold" aria-hidden />}
                      </motion.span>
                    </button>
                  </motion.div>
                </div>

                {/* ---------- FOOTER ---------- */}
                <div className="border-t border-rose-100 bg-card px-5 py-4 dark:border-stone-800">
                  {/* Coupon */}
                  <AnimatePresence mode="wait" initial={false}>
                    {coupon ? (
                      <motion.div
                        key="coupon-applied"
                        initial={{ opacity: 0, y: 8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ type: "spring", stiffness: 380, damping: 24 }}
                        className="mb-3 flex items-center justify-between rounded-2xl border border-dashed border-mint/60 bg-mint/10 px-3.5 py-2.5"
                      >
                        <span className="flex items-center gap-2 text-xs font-extrabold text-mint">
                          <BadgeCheck className="h-4 w-4" aria-hidden />
                          {coupon} · {appliedCoupon?.label ?? "applied"}
                        </span>
                        <button
                          onClick={() => {
                            setCoupon(null);
                            setCouponInput("");
                          }}
                          className="text-[11px] font-bold text-stone-400 underline-offset-2 transition hover:text-brand hover:underline"
                          aria-label="Remove coupon"
                        >
                          Remove
                        </button>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="coupon-input"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mb-3"
                      >
                        <div className="flex gap-2">
                          <div className="relative min-w-0 flex-1">
                            <TicketPercent
                              className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold"
                              aria-hidden
                            />
                            <input
                              value={couponInput}
                              onChange={(e) => {
                                setCouponInput(e.target.value);
                                setCouponError(null);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && applyCoupon()}
                              placeholder="Coupon code"
                              aria-label="Coupon code"
                              aria-invalid={!!couponError}
                              className={cn(
                                "h-10 w-full rounded-2xl border bg-cream pl-9 pr-3 text-xs font-bold uppercase tracking-wide text-foreground placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-300 focus:outline-none focus:ring-2 dark:bg-stone-900 dark:placeholder:text-stone-600",
                                couponError
                                  ? "border-rose-400 focus:ring-rose-200"
                                  : "border-stone-200 focus:border-rose-300 focus:ring-rose-200 dark:border-stone-700"
                              )}
                            />
                          </div>
                          <motion.button
                            whileTap={{ scale: 0.94 }}
                            onClick={applyCoupon}
                            disabled={!couponInput.trim()}
                            className="h-10 shrink-0 rounded-2xl bg-charcoal px-4 text-xs font-extrabold text-cream transition hover:bg-stone-700 disabled:opacity-40"
                          >
                            Apply
                          </motion.button>
                        </div>
                        {couponError ? (
                          <motion.p
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="mt-1.5 text-[11px] font-bold text-brand"
                            role="alert"
                          >
                            {couponError}
                          </motion.p>
                        ) : (
                          <p className="mt-1.5 text-[11px] text-stone-400">
                            Psst… try{" "}
                            <button
                              onClick={() => setCouponInput("BLISS10")}
                              className="font-extrabold text-gold underline decoration-dashed underline-offset-2 hover:text-amber-600"
                            >
                              BLISS10
                            </button>{" "}
                            for 10% off · wheel wins work too 🎡
                          </p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-stone-500">Subtotal</span>
                    <span className="font-extrabold text-foreground">{formatINR(subtotal)}</span>
                  </div>
                  {discount > 0 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="mb-1 flex justify-between text-sm"
                    >
                      <span className="text-mint">Coupon {coupon}</span>
                      <span className="font-bold text-mint">−{formatINR(discount)}</span>
                    </motion.div>
                  )}
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-stone-500">Delivery</span>
                    <span className={cn("font-bold", freeShipUnlocked ? "text-mint" : "text-foreground")}>
                      {freeShipUnlocked ? "FREE" : formatINR(99)}
                    </span>
                  </div>
                  <AnimatePresence initial={false}>
                    {premiumWrap && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-1 flex justify-between overflow-hidden text-sm"
                      >
                        <span className="flex items-center gap-1 text-amber-700">
                          <Ribbon className="h-3.5 w-3.5" aria-hidden /> Premium wrap
                        </span>
                        <span className="font-bold text-foreground">{formatINR(49)}</span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={checkout}
                    disabled={checkingOut}
                    className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90 disabled:opacity-70"
                  >
                    {checkingOut ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Wrapping your gifts…
                      </>
                    ) : (
                      <>
                        <Lock className="h-4 w-4" aria-hidden />
                        Checkout · {formatINR(grandTotal)}
                        {discount > 0 && (
                          <span className="ml-1 rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">
                            saved {formatINR(discount)}
                          </span>
                        )}
                      </>
                    )}
                  </motion.button>
                  <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-stone-400">
                    <PartyPopper className="h-3 w-3" aria-hidden />
                    {premiumWrap
                      ? "Premium wrap +₹49 shown above · 100% secure payments"
                      : "Free basic gift wrap · 100% secure payments"}
                  </p>
                </div>
              </>
            )}
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
}
