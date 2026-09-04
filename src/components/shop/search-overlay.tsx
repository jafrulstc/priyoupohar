"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { Search, Flower2, Cake, Gift, Sprout, Package, TrendingUp, ArrowRight, Loader2 } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { formatINR } from "@/lib/format";
import type { Product } from "@/lib/types";
import { CATEGORIES } from "@/lib/types";

const CATEGORY_META: Record<string, { icon: React.ElementType; label: string }> = {
  flowers: { icon: Flower2, label: "Flowers" },
  cakes: { icon: Cake, label: "Cakes" },
  personalised: { icon: Gift, label: "Personalised" },
  plants: { icon: Sprout, label: "Plants" },
  combos: { icon: Package, label: "Combos" },
};

const TRENDING = ["Red roses", "Truffle cake", "Teddy", "Midnight", "Mug", "Orchid"];

export default function SearchOverlay() {
  const isOpen = useShopStore((s) => s.isSearchOpen);
  const setOpen = useShopStore((s) => s.setSearchOpen);
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const { toast } = useToast();

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* ⌘K / Ctrl+K shortcut */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(!useShopStore.getState().isSearchOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  /* reset on close */
  useEffect(() => {
    if (!isOpen) {
      const t = setTimeout(() => {
        setQuery("");
        setResults([]);
      }, 250);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  /* debounced live search */
  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    if (query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/products?q=${encodeURIComponent(query.trim())}&limit=8`);
        const data = await res.json();
        setResults(data.products ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [query]);

  const pick = (p: Product) => {
    setOpen(false);
    setTimeout(() => setQuickView(p), 180);
  };

  const browseCategory = (id: string, label: string) => {
    setOpen(false);
    toast({
      title: `Browsing ${label} ✨`,
      description: "Scrolling to the freshest picks…",
    });
    setTimeout(() => {
      document.querySelector("#bestsellers")?.scrollIntoView({ behavior: "smooth" });
    }, 200);
    void id;
  };

  return (
    <CommandDialog open={isOpen} onOpenChange={setOpen} className="max-w-xl">
      <div className="relative">
        <CommandInput
          placeholder="Search flowers, cakes, gifts…"
          value={query}
          onValueChange={setQuery}
          className="h-13 text-base"
        />
        {loading && (
          <Loader2
            className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-brand dark:text-rose-400"
            aria-hidden
          />
        )}
      </div>
      <CommandList className="min-h-72 scrollbar-slim">
        {query.trim().length < 2 && (
          <>
            <CommandGroup heading="Trending searches 🔥">
              {TRENDING.map((t) => (
                <CommandItem
                  key={t}
                  value={`trending-${t}`}
                  onSelect={() => setQuery(t)}
                  className="gap-2.5 rounded-xl aria-selected:bg-brand-soft dark:aria-selected:bg-rose-950/50"
                >
                  <TrendingUp className="h-4 w-4 text-gold" aria-hidden />
                  <span className="font-semibold">{t}</span>
                  <ArrowRight className="ml-auto h-3.5 w-3.5 text-stone-300" aria-hidden />
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Browse categories">
              {CATEGORIES.map((c) => {
                const Icon = CATEGORY_META[c.id].icon;
                return (
                  <CommandItem
                    key={c.id}
                    value={`cat-${c.id}`}
                    onSelect={() => browseCategory(c.id, c.label)}
                    className="gap-2.5 rounded-xl aria-selected:bg-brand-soft dark:aria-selected:bg-rose-950/50"
                  >
                    <span className="grid h-7 w-7 place-items-center rounded-lg bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300">
                      <Icon className="h-3.5 w-3.5" aria-hidden />
                    </span>
                    <span className="font-semibold">{c.label}</span>
                    <span className="ml-auto text-xs text-stone-400">{c.emoji}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </>
        )}

        {query.trim().length >= 2 && !loading && results.length === 0 && (
          <CommandEmpty>
            <div className="py-8 text-center">
              <Search className="mx-auto mb-2 h-8 w-8 text-stone-300" aria-hidden />
              <p className="text-sm font-bold text-foreground">No gifts matched “{query}”</p>
              <p className="mt-1 text-xs text-stone-400">Try “roses”, “cake” or “teddy” 🌸</p>
            </div>
          </CommandEmpty>
        )}

        {results.length > 0 && (
          <CommandGroup heading={`${results.length} gift${results.length === 1 ? "" : "s"} found`}>
            <AnimatePresence initial={false}>
              {results.map((p, i) => {
                const meta = CATEGORY_META[p.category];
                const Icon = meta?.icon ?? Package;
                return (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <CommandItem
                      value={`${p.name}-${p.id}`}
                      onSelect={() => pick(p)}
                      className="gap-3 rounded-xl py-2 aria-selected:bg-brand-soft dark:aria-selected:bg-rose-950/50"
                    >
                      <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl">
                        <img src={p.image} alt="" className="h-full w-full object-cover" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-bold text-foreground">
                          {p.name}
                        </span>
                        <span className="flex items-center gap-1.5 text-[11px] text-stone-400">
                          <Icon className="h-3 w-3" aria-hidden />
                          {meta?.label ?? p.category}
                          {p.sameDay && (
                            <span className="rounded-full bg-mint/10 px-1.5 py-0.5 font-bold text-mint">
                              Same-day
                            </span>
                          )}
                        </span>
                      </span>
                      <span className="text-sm font-extrabold text-brand dark:text-rose-400">{formatINR(p.price)}</span>
                    </CommandItem>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </CommandGroup>
        )}
      </CommandList>
      <div className="flex items-center justify-between border-t border-stone-100 px-4 py-2.5 text-[11px] text-stone-400 dark:border-stone-800">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-500 dark:border-stone-700 dark:bg-stone-800/60">
            ↑↓
          </kbd>
          navigate
          <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-500 dark:border-stone-700 dark:bg-stone-800/60">
            ↵
          </kbd>
          open
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border border-stone-200 bg-stone-50 px-1.5 py-0.5 font-mono text-[10px] font-bold text-stone-500 dark:border-stone-700 dark:bg-stone-800/60">
            ESC
          </kbd>
          close
          <span className="mx-1">·</span>
          <Search className="h-3 w-3" aria-hidden />
          PriyoUpohar search
        </span>
      </div>
    </CommandDialog>
  );
}
