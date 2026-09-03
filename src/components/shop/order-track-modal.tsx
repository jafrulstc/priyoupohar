"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  ClipboardList,
  Truck,
  Home,
  Check,
  Loader2,
  Radar,
  History,
  CalendarClock,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { miniConfetti } from "@/lib/confetti";
import { pyFetch, type OrderTimeline } from "@/lib/py-api";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const STEPS = [
  {
    label: "Order placed",
    hint: "Payment confirmed · gift wrapped",
    icon: ClipboardList,
  },
  {
    label: "Packed with love",
    hint: "Freshness sealed · ribbon on top",
    icon: Package,
  },
  {
    label: "Out for delivery",
    hint: "Riding through the city 🛵",
    icon: Truck,
  },
  {
    label: "Delivered",
    hint: "Smiles delivered — mission accomplished!",
    icon: Home,
  },
] as const;

const REAL_STATUS_META: Record<string, { icon: typeof Truck; chip: string }> = {
  pending: { icon: ClipboardList, chip: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300" },
  confirmed: { icon: CheckCircle2, chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300" },
  preparing: { icon: Package, chip: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300" },
  shipped: { icon: Truck, chip: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300" },
  delivered: { icon: Home, chip: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300" },
  cancelled: { icon: XCircle, chip: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300" },
};

export default function OrderTrackModal() {
  const isOpen = useShopStore((s) => s.isTrackOpen);
  const setOpen = useShopStore((s) => s.setTrackOpen);
  const lastOrderId = useShopStore((s) => s.lastOrderId);
  const orderHistory = useShopStore((s) => s.orderHistory);
  const mounted = useMounted();
  const { toast } = useToast();

  const [orderId, setOrderId] = useState("");
  const [phase, setPhase] = useState<number | null>(null); // null = not tracking
  const [real, setReal] = useState<OrderTimeline | null>(null); // Task 2.3
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /* stop the simulator when the dialog closes */
  useEffect(() => {
    if (isOpen) return;
    if (timerRef.current) clearInterval(timerRef.current);
  }, [isOpen]);

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    []
  );

  const startTracking = (id: string) => {
    const trimmed = id.trim();
    if (!trimmed) {
      toast({
        title: "Need an order ID 🔍",
        description: "Try the one from your last checkout!",
      });
      return;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setOrderId(trimmed);
    setReal(null);
    setPhase(0);
    /* Task 2.3 — try the real status history first (BB-… order numbers). */
    pyFetch<OrderTimeline>(
      `/api/store/orders/${encodeURIComponent(trimmed)}/timeline`
    )
      .then((data) => {
        if (timerRef.current) clearInterval(timerRef.current);
        setReal(data);
        if (data.order.status === "delivered") miniConfetti();
      })
      .catch(() => {
        /* not a real order — run the demo simulator below */
        timerRef.current = setInterval(() => {
          setPhase((p) => {
            if (p === null) return p;
            if (p >= STEPS.length - 1) {
              if (timerRef.current) clearInterval(timerRef.current);
              miniConfetti();
              return p;
            }
            return p + 1;
          });
        }, 1100);
      });
  };

  const done = phase === STEPS.length - 1;

  /* real checkout context: the tracked order's chosen delivery window */
  const trackedRecord = mounted
    ? orderHistory.find((o) => o.id === orderId.trim().toUpperCase())
    : undefined;
  const slotLabel = trackedRecord?.slot;

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          if (timerRef.current) clearInterval(timerRef.current);
          setPhase(null);
          setOrderId("");
          setReal(null);
          setOpen(false);
        }
      }}
    >
      <DialogContent className="max-h-[85dvh] max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-md">
        {/* Banner */}
        <div className="relative overflow-hidden bg-charcoal px-5 py-5 text-white sm:px-6">
          <div aria-hidden className="bg-dotted absolute inset-0 opacity-15" />
          <motion.div
            animate={{ x: [-4, 4, -4], y: [0, -3, 0] }}
            transition={{ repeat: Infinity, duration: 2.6, ease: "easeInOut" }}
            className="relative"
          >
            <Radar className="h-6 w-6 text-gold" aria-hidden />
          </motion.div>
          <DialogTitle className="relative mt-2 text-xl font-extrabold tracking-tight">
            Track your order
          </DialogTitle>
          <DialogDescription className="relative mt-0.5 text-xs font-semibold text-stone-400">
            Live courier updates, straight from our demo van 🛵
          </DialogDescription>
        </div>

        <div className="px-5 py-5 sm:px-6">
          {/* Input row */}
          {phase === null ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-3"
            >
              <label
                htmlFor="order-id"
                className="text-xs font-bold uppercase tracking-wide text-stone-500"
              >
                Order ID
              </label>
              <div className="flex gap-2">
                <input
                  id="order-id"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && startTracking(orderId)}
                  placeholder="e.g. BBMC0A37"
                  className="h-11 min-w-0 flex-1 rounded-2xl border border-stone-200 bg-card px-4 font-mono text-sm font-bold uppercase text-foreground placeholder:font-sans placeholder:font-normal placeholder:normal-case placeholder:text-stone-300 dark:border-stone-700 dark:placeholder:text-stone-500 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200"
                />
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => startTracking(orderId)}
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand text-white shadow-lift transition-colors hover:bg-rose-700"
                  aria-label="Track order"
                >
                  <Radar className="h-4.5 w-4.5" aria-hidden />
                </motion.button>
              </div>

              {mounted && lastOrderId && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  onClick={() => startTracking(lastOrderId)}
                  className="flex w-fit items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-[11px] font-bold text-amber-700 transition hover:bg-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:hover:bg-amber-950/60"
                >
                  <History className="h-3 w-3" aria-hidden />
                  Use last order ·{" "}
                  <span className="font-mono">{lastOrderId}</span>
                </motion.button>
              )}

              {mounted && orderHistory.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="rounded-2xl border border-stone-200 bg-cream p-3 dark:border-stone-700 dark:bg-stone-900"
                >
                  <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                    <History className="h-3 w-3" aria-hidden />
                    Recent orders · {orderHistory.length}
                  </p>
                  <div className="mt-2 flex max-h-28 flex-wrap gap-1.5 overflow-y-auto scrollbar-slim">
                    {orderHistory.slice(0, 6).map((o) => (
                      <motion.button
                        key={o.id}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => startTracking(o.id)}
                        className="flex items-center gap-1.5 rounded-full border border-rose-100 bg-card px-2.5 py-1 text-[10px] font-bold text-foreground transition hover:border-brand hover:text-brand dark:border-stone-800"
                        aria-label={`Track order ${o.id}`}
                      >
                        <span className="font-mono">{o.id}</span>
                        <span className="text-brand dark:text-rose-400">{formatINR(o.total)}</span>
                        <span className="text-stone-300">
                          {new Date(o.at).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                          })}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              <p className="pt-1 text-[11px] leading-relaxed text-stone-400">
                Demo tip: any ID works — checkout on this site to get a real one.
              </p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {/* status header */}
              <div className="flex items-center justify-between rounded-2xl bg-cream px-4 py-3 dark:bg-stone-900">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wide text-stone-400">
                    Order
                  </p>
                  <p className="font-mono text-sm font-extrabold text-foreground">
                    {orderId}
                  </p>
                  {real && (
                    <p className="text-[10px] font-semibold text-stone-400">
                      {real.order.city} · {formatINR(Number(real.order.total))}
                    </p>
                  )}
                </div>
                <span
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-extrabold",
                    real
                      ? REAL_STATUS_META[real.order.status]?.chip ??
                        "bg-stone-100 text-stone-700"
                      : done
                        ? "bg-mint/15 text-mint"
                        : "bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300"
                  )}
                >
                  {real ? (
                    <>
                      {(REAL_STATUS_META[real.order.status]?.icon ?? Package) ===
                      ClipboardList ? (
                        <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                      ) : (
                        (() => {
                          const Icon =
                            REAL_STATUS_META[real.order.status]?.icon ?? Package;
                          return <Icon className="h-3.5 w-3.5" aria-hidden />;
                        })()
                      )}
                      {real.order.status.charAt(0).toUpperCase() +
                        real.order.status.slice(1)}
                    </>
                  ) : done ? (
                    <>
                      <Check className="h-3.5 w-3.5" aria-hidden /> Delivered
                    </>
                  ) : (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />{" "}
                      On the way…
                    </>
                  )}
                </span>
              </div>

              {/* chosen delivery window — real data from checkout */}
              {slotLabel && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-2 flex items-center gap-2 rounded-xl border border-dashed border-gold/70 bg-gold-soft/60 px-3 py-2 text-[11px] font-bold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300"
                >
                  <CalendarClock className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  Delivery window · <b className="font-extrabold">{slotLabel}</b>
                </motion.div>
              )}

              {/* timeline — real status history (Task 2.3) or demo sim */}
              {real ? (
                <ol className="relative mt-5 space-y-4 pl-1">
                  <span
                    aria-hidden
                    className="absolute bottom-4 left-[15px] top-4 w-0.5 bg-stone-200 dark:bg-stone-700"
                  />
                  {real.events.map((e, i) => {
                    const meta = REAL_STATUS_META[e.status];
                    const Icon = meta?.icon ?? Package;
                    const last = i === real.events.length - 1;
                    return (
                      <motion.li
                        key={e.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="relative flex items-start gap-3"
                      >
                        <span
                          className={cn(
                            "z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border-2 bg-card",
                            last
                              ? "border-brand text-brand"
                              : "border-stone-200 text-stone-400 dark:border-stone-700"
                          )}
                        >
                          <Icon className="h-3.5 w-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 pt-0.5">
                          <p className="text-sm font-extrabold capitalize text-foreground">
                            {e.status}
                          </p>
                          {e.note && <p className="text-xs text-stone-400">{e.note}</p>}
                          <p className="text-[10px] font-bold text-stone-300">
                            {new Date(e.created_at).toLocaleString("en-IN", {
                              day: "numeric",
                              month: "short",
                              hour: "numeric",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                      </motion.li>
                    );
                  })}
                </ol>
              ) : (
              <ol className="relative mt-5 space-y-5 pl-1">
                {/* track line */}
                <span
                  aria-hidden
                  className="absolute bottom-5 left-[19px] top-5 w-0.5 bg-stone-200 dark:bg-stone-700"
                />
                <motion.span
                  aria-hidden
                  className="absolute left-[19px] top-5 w-0.5 origin-top bg-gradient-brand"
                  initial={false}
                  animate={{
                    height:
                      phase === null
                        ? 0
                        : `${(phase / (STEPS.length - 1)) * 100}%`,
                  }}
                  transition={{ type: "spring", stiffness: 120, damping: 22 }}
                  style={{ bottom: "auto" }}
                />
                {STEPS.map((step, i) => {
                  const reached = phase !== null && i <= phase;
                  const isCurrent = phase === i && !done;
                  const Icon = step.icon;
                  return (
                    <motion.li
                      key={step.label}
                      className="relative flex items-start gap-3"
                      initial={false}
                      animate={{
                        opacity: reached ? 1 : 0.45,
                      }}
                    >
                      <motion.span
                        initial={false}
                        animate={isCurrent ? { scale: [1, 1.12, 1] } : { scale: 1 }}
                        transition={
                          isCurrent
                            ? { repeat: Infinity, duration: 1.4, ease: "easeInOut" }
                            : { type: "spring", stiffness: 400, damping: 18 }
                        }
                        className={cn(
                          "z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 bg-card",
                          reached
                            ? "border-brand text-brand"
                            : "border-stone-200 text-stone-300 dark:border-stone-700"
                        )}
                      >
                        {i < (phase ?? 0) || done ? (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 500, damping: 15 }}
                          >
                            <Check className="h-4 w-4" aria-hidden />
                          </motion.span>
                        ) : (
                          <Icon className="h-4 w-4" aria-hidden />
                        )}
                      </motion.span>
                      <div className="min-w-0 pt-1">
                        <p
                          className={cn(
                            "text-sm font-extrabold",
                            reached ? "text-foreground" : "text-stone-400"
                          )}
                        >
                          {step.label}
                          {isCurrent && (
                            <motion.span
                              className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-brand align-middle"
                              animate={{ opacity: [1, 0.2, 1] }}
                              transition={{ repeat: Infinity, duration: 1 }}
                              aria-hidden
                            />
                          )}
                        </p>
                        <p className="text-xs text-stone-400">
                          {i === 2 && slotLabel
                            ? `Arriving ${slotLabel} 🛵`
                            : step.hint}
                        </p>
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
              )}

              {/* actions */}
              <div className="mt-6 flex gap-2">
                <button
                  onClick={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setPhase(null);
                    setReal(null);
                  }}
                  className="h-10 flex-1 rounded-2xl border border-stone-200 bg-card text-sm font-bold text-stone-600 transition hover:border-rose-300 hover:text-brand dark:border-stone-700 dark:text-stone-300"
                >
                  Track another
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    if (timerRef.current) clearInterval(timerRef.current);
                    setPhase(null);
                    setOrderId("");
                    setOpen(false);
                    toast({
                      title: "Thanks for riding along! 🛵",
                      description: "Your gifts are (imaginary) safe with us.",
                    });
                  }}
                  className="h-10 flex-1 rounded-2xl bg-gradient-brand text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
