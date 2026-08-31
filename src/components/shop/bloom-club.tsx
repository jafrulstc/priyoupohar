"use client";

import { motion } from "framer-motion";
import {
  Flower2,
  Crown,
  Truck,
  TicketPercent,
  History,
  Radar,
  Sparkles,
  ShoppingBag,
  PartyPopper,
} from "lucide-react";
import {
  useShopStore,
  LOYALTY_TARGET,
  LOYALTY_TIERS,
  loyaltyRewardFor,
  type OrderRecord,
} from "@/lib/store";
import { resolveCoupon } from "@/lib/coupons";
import { useMounted } from "@/hooks/use-mounted";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const TIER_META: Record<string, { icon: typeof Crown; blurb: string }> = {
  BLOOM100: { icon: Crown, blurb: "₹100 flat off your next order" },
  SHIPFREE: { icon: Truck, blurb: "Free shipping, any order size" },
  SPIN15: { icon: TicketPercent, blurb: "15% off your whole order" },
};

const fmtDay = (ts: number) =>
  new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function OrderChip({ order, onClick }: { order: OrderRecord; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex shrink-0 items-center gap-2 rounded-full border border-stone-200 bg-card px-3 py-1.5 text-[11px] font-bold shadow-soft transition hover:border-brand hover:text-brand dark:border-stone-700 dark:hover:border-rose-500/60"
      aria-label={`Track order ${order.id}`}
    >
      <Radar className="h-3.5 w-3.5 text-brand dark:text-rose-400" aria-hidden />
      <span className="font-mono">{order.id}</span>
      <span className="text-stone-400 group-hover:text-brand dark:group-hover:text-rose-400">
        {formatINR(order.total)} · {fmtDay(order.at)}
      </span>
    </button>
  );
}

export default function BloomClub() {
  const mounted = useMounted();
  const stamps = useShopStore((s) => s.stamps);
  const ordersCount = useShopStore((s) => s.ordersCount);
  const rewardCoupon = useShopStore((s) => s.rewardCoupon);
  const orderHistory = useShopStore((s) => s.orderHistory);
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const setTrackOpen = useShopStore((s) => s.setTrackOpen);

  const cycle = Math.floor(Math.max(ordersCount, 0) / LOYALTY_TARGET) + 1;
  const nextReward = loyaltyRewardFor(cycle);
  const nextMeta = resolveCoupon(nextReward);
  const toGo = Math.max(0, LOYALTY_TARGET - stamps);
  const pct = Math.min(100, Math.round((stamps / LOYALTY_TARGET) * 100));

  /* which rung of the ladder is up next (tier of the current cycle) */
  const nextTierIndex = (cycle - 1) % LOYALTY_TIERS.length;
  /* tier i corresponds to cycle number: current cycle + wrap-aware offset */
  const cycleForIndex = (i: number) =>
    cycle + ((i - nextTierIndex + LOYALTY_TIERS.length) % LOYALTY_TIERS.length);

  return (
    <section id="bloom-club" className="relative scroll-mt-24 overflow-hidden py-16 md:py-24">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dotted opacity-60" />
      <div className="relative mx-auto max-w-7xl px-4 md:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <motion.span
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold-soft px-4 py-1.5 text-xs font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:bg-amber-950/40 dark:text-amber-300"
          >
            <Sparkles className="h-3.5 w-3.5 animate-wiggle" aria-hidden />
            Bloom Club
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.06 }}
            className="mt-4 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl"
          >
            Rewards that <span className="text-gradient-brand">keep climbing</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.12 }}
            className="mt-3 text-sm text-stone-500 dark:text-stone-400 md:text-base"
          >
            Every 3rd order blooms into a bigger reward — {LOYALTY_TIERS.map((t) => resolveCoupon(t)?.label).join(", ")} and around again.
          </motion.p>
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {/* ---------- STAMP CARD ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            className="relative overflow-hidden rounded-[2rem] border border-rose-100 bg-card p-6 shadow-soft dark:border-stone-800 md:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-gradient-to-br from-rose-100 to-amber-50 opacity-70 dark:from-rose-950/50 dark:to-amber-950/30"
            />
            <div className="relative flex items-center gap-3">
              <motion.span
                animate={{ rotate: [0, -8, 8, 0] }}
                transition={{ repeat: Infinity, duration: 3.6, ease: "easeInOut" }}
                className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-lift"
                aria-hidden
              >
                <Flower2 className="h-5.5 w-5.5" />
              </motion.span>
              <div>
                <h3 className="text-lg font-extrabold text-foreground">Your stamp card</h3>
                <p className="text-xs font-semibold text-stone-400">
                  {mounted ? `${ordersCount} order${ordersCount === 1 ? "" : "s"} so far · cycle ${cycle}` : "Order to start blooming"}
                </p>
              </div>
              <span className="ml-auto rounded-full bg-brand-soft px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide text-brand dark:bg-rose-950/50 dark:text-rose-300">
                {mounted ? `${stamps}/${LOYALTY_TARGET}` : `0/${LOYALTY_TARGET}`}
              </span>
            </div>

            {/* stamps */}
            <div className="relative mt-6 flex items-center gap-3">
              {Array.from({ length: LOYALTY_TARGET }).map((_, i) => {
                const filled = mounted && i < stamps;
                return (
                  <motion.span
                    key={i}
                    initial={false}
                    animate={filled ? { scale: [1, 1.3, 1], rotate: [0, 16, 0] } : { scale: 1 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className={cn(
                      "grid h-14 w-14 place-items-center rounded-2xl border-2 border-dashed",
                      filled
                        ? "border-brand bg-brand-soft dark:border-rose-400 dark:bg-rose-950/60"
                        : "border-rose-200 bg-cream dark:border-stone-700 dark:bg-stone-900"
                    )}
                  >
                    <Flower2
                      className={cn(
                        "h-6 w-6",
                        filled ? "fill-brand text-brand dark:text-rose-300 dark:fill-rose-300" : "text-rose-200 dark:text-stone-600"
                      )}
                      aria-hidden
                    />
                  </motion.span>
                );
              })}
              <div className="ml-1 flex-1">
                <div className="h-2.5 overflow-hidden rounded-full bg-rose-100 dark:bg-stone-800">
                  <motion.div
                    className="h-full rounded-full bg-gradient-brand"
                    initial={false}
                    animate={{ width: `${mounted ? pct : 0}%` }}
                    transition={{ type: "spring", stiffness: 120, damping: 20 }}
                  />
                </div>
                <p className="mt-2 text-xs font-bold text-stone-500 dark:text-stone-400">
                  {mounted
                    ? toGo === 0
                      ? "Reward ready — place any order to bank it"
                      : `${toGo} more order${toGo === 1 ? "" : "s"} → ${nextMeta?.label ?? "a reward"}`
                    : `Every ${LOYALTY_TARGET}rd order unlocks a reward`}
                </p>
              </div>
            </div>

            {/* unlocked reward */}
            {mounted && rewardCoupon && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative mt-5 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-gold bg-gold-soft/70 px-4 py-3 dark:bg-amber-950/30"
              >
                <span className="flex items-center gap-2 text-xs font-extrabold text-amber-700 dark:text-amber-300">
                  <PartyPopper className="h-4 w-4" aria-hidden />
                  {rewardCoupon} · {resolveCoupon(rewardCoupon)?.label} waiting in your bag
                </span>
                <button
                  onClick={() => setCartOpen(true)}
                  className="flex shrink-0 items-center gap-1.5 rounded-full bg-charcoal px-3.5 py-1.5 text-[10px] font-extrabold text-cream transition hover:bg-stone-700"
                >
                  <ShoppingBag className="h-3.5 w-3.5" aria-hidden />
                  Use in bag
                </button>
              </motion.div>
            )}

            {/* order history */}
            {mounted && orderHistory.length > 0 && (
              <div className="relative mt-6 border-t border-rose-100 pt-4 dark:border-stone-800">
                <p className="mb-2.5 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                  <History className="h-3.5 w-3.5" aria-hidden />
                  Recent orders · tap to track
                </p>
                <div className="flex max-h-24 gap-2 overflow-y-auto pb-1 scrollbar-slim max-md:flex-wrap">
                  {orderHistory.slice(0, 6).map((o) => (
                    <OrderChip key={o.id} order={o} onClick={() => setTrackOpen(true)} />
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* ---------- REWARD LADDER ---------- */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ delay: 0.08 }}
            className="relative overflow-hidden rounded-[2rem] bg-charcoal p-6 text-cream shadow-lift md:p-8"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -left-16 -top-16 h-52 w-52 rounded-full bg-brand/25 blur-2xl"
            />
            <div className="relative flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold/15 text-gold ring-1 ring-gold/40" aria-hidden>
                <Crown className="h-5.5 w-5.5" />
              </span>
              <div>
                <h3 className="text-lg font-extrabold">The reward ladder</h3>
                <p className="text-xs font-semibold text-stone-400">
                  Climbs every {LOYALTY_TARGET} orders — and loops forever
                </p>
              </div>
            </div>

            <ol className="relative mt-6 space-y-3">
              {LOYALTY_TIERS.map((code, i) => {
                const meta = TIER_META[code];
                const Icon = meta.icon;
                const label = resolveCoupon(code)?.label ?? code;
                const isNext = mounted && i === nextTierIndex;
                const tierCycle = cycleForIndex(i);
                const rangeStart = (tierCycle - 1) * LOYALTY_TARGET + 1;
                const rangeEnd = tierCycle * LOYALTY_TARGET;
                return (
                  <motion.li
                    key={code}
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className={cn(
                      "flex items-center gap-3.5 rounded-2xl border p-3.5 transition-colors",
                      isNext
                        ? "border-gold/60 bg-gold/10 ring-1 ring-gold/40"
                        : "border-white/10 bg-white/5"
                    )}
                  >
                    <span
                      className={cn(
                        "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                        isNext ? "bg-gold text-charcoal" : "bg-white/10 text-gold"
                      )}
                      aria-hidden
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 text-sm font-extrabold">
                        {label}
                        <span className="rounded-full bg-white/10 px-2 py-0.5 font-mono text-[10px] text-stone-300">
                          {code}
                        </span>
                        {isNext && (
                          <span className="rounded-full bg-gold px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-charcoal animate-pulse-glow">
                            Up next
                          </span>
                        )}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-stone-400">{meta.blurb}</p>
                    </div>
                    <span className="shrink-0 text-right text-[10px] font-bold uppercase tracking-wide text-stone-400">
                      Orders
                      <span className="ml-1 text-stone-300">
                        {rangeStart}–{rangeEnd}
                      </span>
                    </span>
                  </motion.li>
                );
              })}
            </ol>

            <div className="relative mt-6 flex items-center gap-2 rounded-2xl border border-dashed border-white/15 bg-white/5 px-4 py-3 text-[11px] font-semibold text-stone-300">
              <Sparkles className="h-4 w-4 shrink-0 text-gold" aria-hidden />
              {mounted
                ? toGo === 0
                  ? `You're on the edge of ${nextMeta?.label ?? "a reward"} — one order away.`
                  : `${toGo} order${toGo === 1 ? "" : "s"} to ${nextMeta?.label ?? "your next reward"}. Keep the streak blooming!`
                : "Start with your first order — the ladder remembers you."}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
