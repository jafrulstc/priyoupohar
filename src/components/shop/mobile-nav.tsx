"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Home, Store, Wand2, CalendarHeart, ShoppingBag } from "lucide-react";
import { useShopStore, cartCount } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { cn } from "@/lib/utils";

const ITEMS = [
  { id: "home", label: "Home", icon: Home, action: "top" },
  { id: "shop", label: "Shop", icon: Store, action: "#bestsellers" },
  { id: "finder", label: "Finder", icon: Wand2, action: "#gift-finder" },
  { id: "occasions", label: "Occasions", icon: CalendarHeart, action: "#occasions" },
] as const;

export default function MobileNav() {
  const [active, setActive] = useState("home");
  const mounted = useMounted();
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const cart = useShopStore((s) => s.cart);
  const lastAddedAt = useShopStore((s) => s.lastAddedAt);

  const count = mounted ? cartCount(cart) : 0;

  const go = (action: string) => {
    if (action === "top") window.scrollTo({ top: 0, behavior: "smooth" });
    else document.querySelector(action)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      aria-label="Mobile navigation"
    >
      <div className="glass border-t border-rose-100 shadow-[0_-8px_30px_-12px_rgba(28,25,23,0.18)] dark:border-stone-800">
        <div className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
          {ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActive(item.id);
                  go(item.action);
                }}
                className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
                aria-label={item.label}
                aria-current={isActive ? "page" : undefined}
              >
                {isActive && (
                  <motion.span
                    layoutId="mobile-nav-pill"
                    className="absolute inset-x-3 inset-y-1 rounded-2xl bg-brand-soft dark:bg-rose-950/50"
                    transition={{ type: "spring", stiffness: 420, damping: 32 }}
                  />
                )}
                <Icon
                  className={cn(
                    "relative z-10 h-5 w-5 transition-colors",
                    isActive ? "text-brand dark:text-rose-400" : "text-stone-500"
                  )}
                  aria-hidden
                />
                <span
                  className={cn(
                    "relative z-10 text-[10px] font-bold transition-colors",
                    isActive ? "text-brand dark:text-rose-400" : "text-stone-500"
                  )}
                >
                  {item.label}
                </span>
              </button>
            );
          })}

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex flex-1 flex-col items-center gap-0.5 py-2"
            aria-label={`Open gift bag, ${count} items`}
          >
            <span className="relative">
              <motion.span
                key={`${count}-${lastAddedAt}`}
                initial={mounted && lastAddedAt > 0 ? { scale: 0.5 } : false}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 16 }}
                className="grid h-9 w-9 place-items-center rounded-2xl bg-brand text-white shadow-lift"
              >
                <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
              </motion.span>
              {count > 0 && (
                <motion.span
                  key={`badge-${count}-${lastAddedAt}`}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 600, damping: 15 }}
                  className="absolute -right-1.5 -top-1.5 grid h-4.5 min-w-4.5 place-items-center rounded-full bg-gold px-1 text-[9px] font-extrabold text-charcoal shadow-soft"
                >
                  {count}
                </motion.span>
              )}
            </span>
            <span className="text-[10px] font-bold text-stone-500">Bag</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
