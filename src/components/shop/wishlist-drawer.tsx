"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Heart,
  ShoppingBag,
  Trash2,
  Check,
  Sparkles,
  ArrowRight,
  Share2,
} from "lucide-react";
import { useShopStore, type ProductSnapshot } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useFocusTrap } from "@/hooks/use-focus-trap";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { miniConfetti, petalConfetti } from "@/lib/confetti";
import { cn } from "@/lib/utils";

/* ---------- single wishlist row ---------- */

function WishRow({ item }: { item: ProductSnapshot }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const removeFromWishlist = useShopStore((s) => s.removeFromWishlist);
  const setQuickView = useShopStore((s) => s.setQuickViewProduct);
  const { toast } = useToast();

  const [added, setAdded] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const moveOne = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    miniConfetti({
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: rect.top / window.innerHeight,
    });
    addToCart({
      id: item.id,
      name: item.name,
      price: item.price,
      mrp: item.mrp,
      image: item.image,
      category: item.category,
    });
    removeFromWishlist(item.id);
    setAdded(true);
    toast({
      title: `${item.name} moved to bag 🛍️`,
      description: "Wish granted!",
    });
    setTimeout(() => setAdded(false), 1500);
  };

  const discard = () => {
    setLeaving(true);
    // let the exit animation play before the store row disappears
    setTimeout(() => removeFromWishlist(item.id), 220);
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, x: 60 }}
      animate={leaving ? { opacity: 0, x: 60 } : { opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60, height: 0, marginBottom: 0, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="flex gap-3 rounded-2xl border border-rose-100 bg-card p-3 shadow-soft dark:border-stone-800"
    >
      <button
        onClick={() => setQuickView(item)}
        className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl transition hover:opacity-90"
        aria-label={`Quick view ${item.name}`}
      >
        { }
        <img
          src={item.image}
          alt={item.name}
          className="h-full w-full object-cover"
        />
      </button>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-2">
          <button
            onClick={() => setQuickView(item)}
            className="line-clamp-2 text-left text-sm font-bold text-foreground transition-colors hover:text-brand"
          >
            {item.name}
          </button>
          <button
            onClick={discard}
            className="shrink-0 text-stone-300 transition hover:text-brand"
            aria-label={`Remove ${item.name} from wishlist`}
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-0.5 flex items-baseline gap-1.5">
          <span className="text-sm font-extrabold text-brand">
            {formatINR(item.price)}
          </span>
          {item.mrp > item.price && (
            <>
              <span className="text-[11px] font-semibold text-stone-400 line-through">
                {formatINR(item.mrp)}
              </span>
              <span className="text-[10px] font-extrabold text-mint">
                {discountPct(item.price, item.mrp)}% off
              </span>
            </>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between pt-2">
          {item.sameDay ? (
            <span className="flex items-center gap-1 rounded-full bg-mint/10 px-2 py-0.5 text-[10px] font-bold text-mint">
              <Sparkles className="h-3 w-3" aria-hidden /> Same-day
            </span>
          ) : (
            <span className="text-[10px] font-semibold text-stone-400">
              2–3 day delivery
            </span>
          )}

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.94 }}
            onClick={moveOne}
            className={cn(
              "flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-extrabold shadow-soft transition-colors",
              added ? "bg-mint text-white" : "bg-brand text-white hover:bg-rose-700"
            )}
          >
            {added ? (
              <motion.span
                key="moved"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-1"
              >
                <Check className="h-3.5 w-3.5" aria-hidden /> Moved!
              </motion.span>
            ) : (
              <>
                <ShoppingBag className="h-3.5 w-3.5" aria-hidden /> Move to bag
              </>
            )}
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

/* ---------- drawer ---------- */

export default function WishlistDrawer() {
  const isOpen = useShopStore((s) => s.isWishlistOpen);
  const setOpen = useShopStore((s) => s.setWishlistOpen);
  const trapRef = useFocusTrap<HTMLDivElement>(isOpen);
  const wishlist = useShopStore((s) => s.wishlist);
  const clearWishlist = useShopStore((s) => s.clearWishlist);
  const addToCart = useShopStore((s) => s.addToCart);
  const setCartOpen = useShopStore((s) => s.setCartOpen);
  const mounted = useMounted();
  const { toast } = useToast();

  const items = mounted ? wishlist : [];
  const subtotal = items.reduce((s, i) => s + i.price, 0);

  /* lock body scroll while open */
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

  const moveAll = () => {
    items.forEach((item) =>
      addToCart({
        id: item.id,
        name: item.name,
        price: item.price,
        mrp: item.mrp,
        image: item.image,
        category: item.category,
      })
    );
    const n = items.length;
    clearWishlist();
    toast({
      title: `${n} wish${n === 1 ? "" : "es"} granted! 🎉`,
      description: "Your whole wishlist hopped into the gift bag.",
    });
    setOpen(false);
    setCartOpen(true);
  };

  /* share the whole wishlist — Web Share API with a clipboard fallback;
     every gift links to its own /gift/slug page with a real OG card */
  const shareWishlist = async () => {
    if (items.length === 0) return;
    const origin = window.location.origin;
    const lines = items
      .map(
        (i) =>
          `🌸 ${i.name} — ${formatINR(i.price)}\n   ${origin}/gift/${i.slug}`
      )
      .join("\n\n");
    const text = `My PriyoUpohar wishlist 💐\n\n${lines}\n\nSurprise me? 🎁`;

    /* legacy copy path — works even when the async Clipboard API is denied */
    const legacyCopy = () => {
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.setAttribute("readonly", "");
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch {
        ok = false;
      }
      document.body.removeChild(ta);
      return ok;
    };

    try {
      if (typeof navigator.share === "function") {
        await navigator.share({
          title: "My PriyoUpohar wishlist 💐",
          text,
        });
        petalConfetti();
        toast({
          title: "Wishlist shared! 💐",
          description: "Fingers crossed for the perfect surprise.",
        });
        return;
      }
      let copied = false;
      try {
        await navigator.clipboard.writeText(text);
        copied = true;
      } catch {
        copied = legacyCopy();
      }
      if (copied) {
        miniConfetti();
        toast({
          title: "Wishlist copied! 📋",
          description: "Paste it in any chat to drop the perfect hint.",
        });
      } else {
        toast({
          title: "Sharing hiccup 😅",
          description: "Couldn’t share just now — please try again.",
        });
      }
    } catch (e) {
      if ((e as Error)?.name === "AbortError") return; // user closed the share sheet
      toast({
        title: "Sharing hiccup 😅",
        description: "Couldn’t share just now — please try again.",
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div
          ref={trapRef}
          className="fixed inset-0 z-[70]"
          role="dialog"
          aria-modal="true"
          aria-label="Wishlist"
        >
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
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-background shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-rose-100 bg-card px-5 py-4 dark:border-stone-800">
              <div className="flex items-center gap-2.5">
                <motion.span
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                  className="grid h-9 w-9 place-items-center rounded-xl bg-rose-100 text-brand dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Heart className="h-4.5 w-4.5 fill-brand" aria-hidden />
                </motion.span>
                <div>
                  <h2 className="text-base font-extrabold text-foreground">Wishlist</h2>
                  <p className="text-xs text-stone-400">
                    {items.length} saved treasure{items.length === 1 ? "" : "s"}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-stone-200 text-stone-500 transition hover:border-rose-300 hover:text-brand dark:border-stone-700"
                aria-label="Close wishlist"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>

            {items.length === 0 ? (
              /* ---------- EMPTY VIEW ---------- */
              <div className="relative flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
                {[...Array(6)].map((_, i) => (
                  <motion.span
                    key={i}
                    className="absolute text-rose-200"
                    style={{
                      left: `${12 + ((i * 61) % 76)}%`,
                      top: `${10 + ((i * 37) % 70)}%`,
                    }}
                    animate={{
                      y: [0, -14, 0],
                      rotate: [0, i % 2 ? 12 : -12, 0],
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      repeat: Infinity,
                      duration: 3 + i * 0.4,
                      ease: "easeInOut",
                      delay: i * 0.3,
                    }}
                    aria-hidden
                  >
                    <Heart
                      className={cn("h-5 w-5", i % 3 === 0 && "fill-rose-200")}
                    />
                  </motion.span>
                ))}
                <motion.div
                  animate={{ y: [0, -10, 0], scale: [1, 1.06, 1] }}
                  transition={{ repeat: Infinity, duration: 3 }}
                  className="relative grid h-24 w-24 place-items-center rounded-full bg-rose-100 text-brand dark:bg-rose-950/40 dark:text-rose-300"
                >
                  <Heart className="h-10 w-10 fill-brand" aria-hidden />
                </motion.div>
                <h3 className="relative font-handwriting text-2xl font-bold text-foreground">
                  No wishes yet
                </h3>
                <p className="relative max-w-64 text-sm text-stone-500">
                  Tap the{" "}
                  <Heart className="inline h-3.5 w-3.5 fill-brand text-brand" aria-hidden />{" "}
                  on any gift to keep it here for later.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="relative mt-2 rounded-full bg-brand px-6 py-3 text-sm font-bold text-white shadow-lift transition hover:bg-rose-700"
                >
                  Discover gifts you&apos;ll love
                </button>
              </div>
            ) : (
              <>
                {/* ---------- ITEMS ---------- */}
                <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4 scrollbar-slim">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {items.map((item) => (
                      <WishRow key={item.id} item={item} />
                    ))}
                  </AnimatePresence>

                  <div className="flex items-center gap-2 rounded-2xl bg-brand-soft px-4 py-3 text-xs font-semibold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                    <Sparkles className="h-4 w-4 shrink-0" aria-hidden />
                    Wishlisted gifts sell out fast — same-day picks move quickest!
                  </div>
                </div>

                {/* ---------- FOOTER ---------- */}
                <div className="border-t border-rose-100 bg-card px-5 py-4 dark:border-stone-800">
                  <div className="mb-3 flex items-center justify-between text-sm">
                    <span className="text-stone-500">
                      {items.length} item{items.length === 1 ? "" : "s"} ready
                    </span>
                    <span className="font-extrabold text-foreground">
                      {formatINR(subtotal)}
                    </span>
                  </div>
                  <button
                    onClick={shareWishlist}
                    className="mb-2 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-rose-200 py-3 text-sm font-extrabold text-brand transition hover:border-brand hover:bg-rose-50 dark:border-stone-700 dark:text-rose-300 dark:hover:border-rose-500/60 dark:hover:bg-stone-800"
                  >
                    <Share2 className="h-4 w-4" aria-hidden />
                    Share wishlist
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={moveAll}
                    className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-brand py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
                  >
                    <Heart className="h-4 w-4 fill-white" aria-hidden />
                    Move all to bag
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </motion.button>
                  <p className="mt-2 flex items-center justify-center gap-1 text-[11px] text-stone-400">
                    <Sparkles className="h-3 w-3 text-gold" aria-hidden />
                    Free shipping on orders over ₹999
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
