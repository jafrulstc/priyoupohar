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
} from "lucide-react";
import { Lottie } from "lottie-react";
import celebrationAnim from "@/lib/lottie/celebration.json";
import { useShopStore, cartTotal, cartCount, FREE_SHIPPING_THRESHOLD } from "@/lib/store";
import { resolveCoupon, couponDiscount } from "@/lib/coupons";
import { useMounted } from "@/hooks/use-mounted";
import { formatINR } from "@/lib/format";
import { celebrationConfetti, petalConfetti } from "@/lib/confetti";
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
};

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
  const { toast } = useToast();

  const mounted = useMounted();
  const [checkingOut, setCheckingOut] = useState(false);
  const [result, setResult] = useState<CheckoutResult | null>(null);
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
  const grandTotal = subtotal - discount + deliveryFee + 49;

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
          slot: "same-day",
          coupon: coupon ?? undefined,
        }),
      });
      if (!res.ok) throw new Error("checkout failed");
      const data = await res.json();
      setResult(data);
      setLastOrderId(data.orderId);
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

          {/* Panel */}
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 32 }}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-cream shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-100 bg-white px-5 py-4">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-soft text-brand">
                  <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
                </span>
                <div>
                  <h2 className="text-base font-extrabold text-charcoal">Your Gift Bag</h2>
                  <p className="text-xs text-stone-400">{count} item{count === 1 ? "" : "s"} of joy</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 transition hover:border-rose-300 hover:text-brand"
                aria-label="Close gift bag"
              >
                <X className="h-4.5 w-4.5" />
              </button>
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
                  <h3 className="text-xl font-extrabold text-charcoal">Order confirmed! 🎉</h3>
                  <p className="mt-1 text-sm text-stone-500">
                    Order <span className="font-mono font-bold text-brand">{result.orderId}</span> is
                    being wrapped with love.
                  </p>
                  <div className="mt-4 w-full space-y-2 rounded-2xl border border-rose-100 bg-white p-4 text-left text-sm shadow-soft">
                    <div className="flex justify-between">
                      <span className="text-stone-500">Paid</span>
                      <span className="font-extrabold text-charcoal">{formatINR(result.total)}</span>
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
                      <span className="font-bold text-charcoal">{result.deliveryTo}</span>
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
                      className="flex items-center justify-center gap-1.5 rounded-full border border-rose-200 bg-white px-4 py-3 text-sm font-bold text-charcoal transition hover:border-brand hover:text-brand"
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
                  className="grid h-24 w-24 place-items-center rounded-full bg-brand-soft text-brand"
                >
                  <Gift className="h-10 w-10" aria-hidden />
                </motion.div>
                <h3 className="text-lg font-extrabold text-charcoal">Your bag is feeling light</h3>
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
                {/* ---------- FREE SHIPPING PROGRESS ---------- */}
                <div className="border-b border-rose-100 bg-white px-5 py-3.5">
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
                      <span className="text-charcoal">
                        Add {formatINR(remaining)} more for{" "}
                        <span className="text-brand">FREE shipping</span>
                      </span>
                    )}
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-rose-100">
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
                        className="flex gap-3 rounded-2xl border border-rose-100 bg-white p-3 shadow-soft"
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
                            <h4 className="line-clamp-2 text-sm font-bold text-charcoal">
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
                            <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-cream p-0.5">
                              <button
                                onClick={() => updateQty(item.id, -1)}
                                className="grid h-6.5 w-6.5 place-items-center rounded-full text-stone-500 transition hover:bg-rose-100 hover:text-brand"
                                aria-label={`Decrease quantity of ${item.name}`}
                              >
                                <Minus className="h-3.5 w-3.5" />
                              </button>
                              <span className="w-6 text-center text-sm font-extrabold text-charcoal">
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
                            <span className="text-sm font-extrabold text-charcoal">
                              {formatINR(item.price * item.qty)}
                            </span>
                          </div>
                        </div>
                      </motion.article>
                    ))}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 rounded-2xl bg-gold-soft px-4 py-3 text-xs font-semibold text-amber-700">
                    <Gift className="h-4 w-4 shrink-0" aria-hidden />
                    Every order ships with a free gift wrap & message card.
                  </div>
                </div>

                {/* ---------- FOOTER ---------- */}
                <div className="border-t border-rose-100 bg-white px-5 py-4">
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
                                "h-10 w-full rounded-2xl border bg-cream pl-9 pr-3 text-xs font-bold uppercase tracking-wide text-charcoal placeholder:font-normal placeholder:normal-case placeholder:tracking-normal placeholder:text-stone-300 focus:outline-none focus:ring-2",
                                couponError
                                  ? "border-rose-400 focus:ring-rose-200"
                                  : "border-stone-200 focus:border-rose-300 focus:ring-rose-200"
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
                    <span className="font-extrabold text-charcoal">{formatINR(subtotal)}</span>
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
                  <div className="mb-3 flex justify-between text-sm">
                    <span className="text-stone-500">Delivery</span>
                    <span className={cn("font-bold", freeShipUnlocked ? "text-mint" : "text-charcoal")}>
                      {freeShipUnlocked ? "FREE" : formatINR(99)}
                    </span>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={checkout}
                    disabled={checkingOut}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90 disabled:opacity-70"
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
                    Includes ₹49 gift wrap · 100% secure payments
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
