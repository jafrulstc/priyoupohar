"use client";

import { motion } from "framer-motion";
import { Gift, Sparkles, Crown } from "lucide-react";
import { useShopStore, LOYALTY_TARGET, cartTotal, FREE_SHIPPING_THRESHOLD } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { formatINR } from "@/lib/format";
import { cn } from "@/lib/utils";

const STAMP_ICONS = [Gift, Gift, Gift];

export default function LoyaltyProgress({
  compact = false,
}: {
  compact?: boolean;
}) {
  const mounted = useMounted();
  const stamps = useShopStore((s) => s.stamps);
  const ordersCount = useShopStore((s) => s.ordersCount);
  const rewardCoupon = useShopStore((s) => s.rewardCoupon);
  const cart = useShopStore((s) => s.cart);

  if (!mounted) return null;

  const total = cartTotal(cart);
  const freeShipProgress = Math.min(1, total / FREE_SHIPPING_THRESHOLD);
  const freeShipRemaining = Math.max(0, FREE_SHIPPING_THRESHOLD - total);
  const progress = stamps / LOYALTY_TARGET;

  return (
    <div className="space-y-4">
      {/* Free shipping progress bar */}
      {total > 0 && total < FREE_SHIPPING_THRESHOLD && (
        <div className="rounded-xl bg-brand-soft/50 p-3 dark:bg-rose-950/30">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-brand dark:text-rose-300">
              <Sparkles className="mr-1 inline h-3 w-3" aria-hidden />
              {formatINR(freeShipRemaining)} more for free shipping!
            </span>
            <span className="font-semibold text-stone-400">
              {formatINR(total)} / {formatINR(FREE_SHIPPING_THRESHOLD)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-stone-200 dark:bg-stone-700">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${freeShipProgress * 100}%` }}
              transition={{ type: "spring", stiffness: 200, damping: 22 }}
              className="h-full rounded-full bg-gradient-brand"
            />
          </div>
        </div>
      )}

      {total >= FREE_SHIPPING_THRESHOLD && total > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center gap-2 rounded-xl bg-mint/10 px-3 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-400"
        >
          <Sparkles className="h-4 w-4 fill-current" aria-hidden />
          Free shipping unlocked on this order!
        </motion.div>
      )}

      {/* Loyalty stamps */}
      <div
        className={cn(
          "rounded-xl border border-rose-100 bg-white p-3 dark:border-stone-800 dark:bg-stone-900",
          compact && "border-0 bg-transparent p-0"
        )}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-gold" aria-hidden />
            <span className="text-xs font-extrabold text-foreground">
              Priyo Club
            </span>
          </div>
          <span className="text-[10px] font-bold text-stone-400">
            {ordersCount} order{ordersCount !== 1 ? "s" : ""} placed
          </span>
        </div>

        {/* Stamp grid */}
        <div className="mt-3 flex items-center gap-3">
          {STAMP_ICONS.map((Icon, i) => {
            const filled = i < stamps;
            return (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  scale: filled ? 1 : 0.85,
                  opacity: filled ? 1 : 0.35,
                }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                className={cn(
                  "grid h-10 w-10 place-items-center rounded-xl border-2 transition-colors",
                  filled
                    ? "border-gold bg-gold-soft text-gold"
                    : "border-stone-200 bg-stone-50 text-stone-300 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-600"
                )}
              >
                <Icon className="h-4.5 w-4.5" aria-hidden />
              </motion.div>
            );
          })}
          <div className="ml-1 flex-1">
            <div className="h-2 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress * 100}%` }}
                transition={{ type: "spring", stiffness: 200, damping: 22 }}
                className="h-full rounded-full bg-gradient-to-r from-gold to-amber-400"
              />
            </div>
            <p className="mt-1 text-[10px] font-semibold text-stone-400">
              {stamps}/{LOYALTY_TARGET} to next reward
            </p>
          </div>
        </div>

        {/* Reward notification */}
        {rewardCoupon && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 flex items-center gap-2 rounded-lg bg-gold-soft px-3 py-2 text-xs font-bold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300"
          >
            <Sparkles className="h-3.5 w-3.5 animate-wiggle" aria-hidden />
            Reward unlocked: <span className="font-extrabold">{rewardCoupon}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
