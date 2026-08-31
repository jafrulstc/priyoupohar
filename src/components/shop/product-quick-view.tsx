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
  Star,
  ShoppingBag,
  Check,
  Heart,
  Minus,
  Plus,
  Truck,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Share2,
  Link2,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import PincodeChecker from "@/components/shop/pincode-checker";
import { cn } from "@/lib/utils";

type QuickProduct = NonNullable<
  ReturnType<typeof useShopStore.getState>["quickViewProduct"]
>;

const TAG_STYLES: Record<string, string> = {
  Bestseller: "bg-gold text-charcoal",
  New: "bg-brand text-white",
  Premium: "bg-charcoal text-white",
};

export default function ProductQuickView() {
  const product = useShopStore((s) => s.quickViewProduct);
  const setProduct = useShopStore((s) => s.setQuickViewProduct);

  /* Keep the URL in sync so ?gift=slug links are shareable/bookmarkable.
     Only strip on a product→null TRANSITION — never on first mount, or we'd
     erase the deep-link before DeepLinkOpener gets a chance to read it. */
  const hadProduct = useRef(false);
  useEffect(() => {
    if (!product) {
      if (hadProduct.current && window.location.search.includes("gift=")) {
        window.history.replaceState(null, "", window.location.pathname);
      }
      return;
    }
    hadProduct.current = true;
    const url = new URL(window.location.href);
    url.searchParams.set("gift", product.slug);
    window.history.replaceState(null, "", url.pathname + "?" + url.searchParams.toString());
  }, [product]);

  return (
    <Dialog
      open={!!product}
      onOpenChange={(open) => {
        if (!open) setProduct(null);
      }}
    >
      <AnimatePresence>
        {product && (
          <DialogContent
            key={product.id}
            className="max-w-[calc(100vw-2rem)] gap-0 overflow-hidden rounded-3xl p-0 sm:max-w-3xl"
            forceMount
          >
            <QuickViewBody key={product.id} product={product} />
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
}

function QuickViewBody({ product }: { product: QuickProduct }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const wishlist = useShopStore((s) => s.wishlist);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const pushRecentlyViewed = useShopStore((s) => s.pushRecentlyViewed);
  const { toast } = useToast();
  const mounted = useMounted();

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const wishlisted = mounted
    ? wishlist.some((w) => w.id === product.id)
    : false;

  /* Remember this product in the recently-viewed rail (zustand set, not React state) */
  useEffect(() => {
    pushRecentlyViewed(product);
  }, [product, pushRecentlyViewed]);

  /* Share via Web Share API, falling back to a copied deep-link */
  const share = async () => {
    const url = `${window.location.origin}/gift/${product.slug}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `${product.name} — Bloom & Bliss`,
          text: `Look at this lovely gift: ${product.name} 🎁`,
          url,
        });
        return;
      }
      throw new Error("no native share");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      try {
        await navigator.clipboard.writeText(url);
        setLinkCopied(true);
        toast({ title: "Link copied! 🔗", description: "Share the joy with anyone." });
        window.setTimeout(() => setLinkCopied(false), 2000);
      } catch {
        toast({ title: "Couldn't share", description: url });
      }
    }
  };

  const add = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    miniConfetti({
      x: (rect.left + rect.width / 2) / window.innerWidth,
      y: rect.top / window.innerHeight,
    });
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.category,
      },
      qty
    );
    setAdded(true);
    toast({
      title: `Added ${qty > 1 ? `${qty} × ` : ""}${product.name} 🛍️`,
      description: "It's waiting in your gift bag.",
    });
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <div className="grid sm:grid-cols-2">
      {/* Image side */}
      <div className="relative aspect-square bg-brand-soft dark:bg-rose-950/50">
        <motion.img
          initial={{ scale: 1.08, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          src={product.image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
        />
        {product.tag && (
          <motion.span
            initial={{ scale: 0, rotate: -8 }}
            animate={{ scale: 1, rotate: -4 }}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.15 }}
            className={cn(
              "absolute left-4 top-4 rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide shadow-soft",
              TAG_STYLES[product.tag] ?? "bg-charcoal text-white"
            )}
          >
            ✨ {product.tag}
          </motion.span>
        )}
        <button
          onClick={() => toggleWishlist(product)}
          aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
          className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft transition dark:bg-stone-900/90 hover:scale-110 active:scale-90"
        >
          <motion.span
            key={String(wishlisted)}
            initial={{ scale: 0.6 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 15 }}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                wishlisted ? "fill-brand text-brand" : "text-stone-400"
              )}
              aria-hidden
            />
          </motion.span>
        </button>
      </div>

      {/* Details side */}
      <div className="flex flex-col p-5 sm:p-6">
        <DialogTitle className="text-xl font-extrabold tracking-tight text-foreground">
          {product.name}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {product.description}
        </DialogDescription>

        <div className="mt-1.5 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className="flex items-center gap-0.5"
              aria-label={`Rated ${product.rating} out of 5`}
            >
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3.5 w-3.5",
                    i < Math.round(product.rating)
                      ? "fill-gold text-gold"
                      : "text-stone-300"
                  )}
                  aria-hidden
                />
              ))}
            </span>
            <span className="text-xs font-bold text-foreground">
              {product.rating.toFixed(1)}
            </span>
            <span className="truncate text-xs text-stone-400">
              · {product.reviews.toLocaleString("en-IN")} reviews
            </span>
          </div>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={share}
            aria-label={`Share ${product.name}`}
            className="flex shrink-0 items-center gap-1 rounded-full border border-stone-200 px-2.5 py-1 text-[11px] font-bold text-stone-500 transition hover:border-rose-300 hover:text-brand dark:border-stone-700"
          >
            {linkCopied ? (
              <Link2 className="h-3 w-3 text-mint" aria-hidden />
            ) : (
              <Share2 className="h-3 w-3" aria-hidden />
            )}
            {linkCopied ? "Copied" : "Share"}
          </motion.button>
        </div>

        <div className="mt-3 flex flex-wrap items-baseline gap-2">
          <span className="text-3xl font-extrabold text-brand dark:text-rose-400">
            {formatINR(product.price)}
          </span>
          {product.mrp > product.price && (
            <>
              <span className="text-sm font-semibold text-stone-400 line-through">
                {formatINR(product.mrp)}
              </span>
              <span className="rounded-full bg-mint/10 px-2 py-0.5 text-xs font-extrabold text-mint">
                {discountPct(product.price, product.mrp)}% OFF
              </span>
            </>
          )}
        </div>

        <p className="mt-3 text-sm leading-relaxed text-stone-600 dark:text-stone-300">
          {product.description}
        </p>

        {/* Delivery info */}
        <div className="mt-4 grid gap-1.5 rounded-2xl bg-cream p-3 text-xs font-semibold text-stone-600 dark:bg-stone-900 dark:text-stone-300">
          <span className="flex items-center gap-2">
            <Truck className="h-3.5 w-3.5 text-brand dark:text-rose-400" aria-hidden />
            {product.sameDay
              ? "Same-day delivery — order in the next 2 hrs"
              : "Standard delivery in 2–3 days"}
          </span>
          <span className="flex items-center gap-2">
            <MoonStar className="h-3.5 w-3.5 text-brand dark:text-rose-400" aria-hidden />
            Midnight delivery available at checkout
          </span>
          <span className="flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-brand dark:text-rose-400" aria-hidden />
            Freshness guaranteed · Free gift wrap
          </span>
        </div>

        {/* Pincode → live ETA checker */}
        <div className="mt-2.5">
          <PincodeChecker compact />
        </div>

        {/* Qty + CTA */}
        <div className="mt-5 flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-full border border-stone-200 bg-cream p-1 dark:border-stone-700 dark:bg-stone-800">
            <button
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              disabled={qty <= 1}
              className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition hover:bg-rose-100 hover:text-brand dark:hover:bg-rose-950/40 disabled:opacity-40"
              aria-label="Decrease quantity"
            >
              <Minus className="h-4 w-4" />
            </button>
            <AnimatePresence mode="popLayout">
              <motion.span
                key={qty}
                initial={{ y: 8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -8, opacity: 0 }}
                className="w-7 text-center text-sm font-extrabold text-foreground"
              >
                {qty}
              </motion.span>
            </AnimatePresence>
            <button
              onClick={() => setQty((q) => Math.min(5, q + 1))}
              className="grid h-8 w-8 place-items-center rounded-full text-stone-500 transition hover:bg-rose-100 hover:text-brand dark:hover:bg-rose-950/40"
              aria-label="Increase quantity"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.96 }}
            onClick={add}
            className={cn(
              "flex h-12 flex-1 items-center justify-center gap-2 rounded-full text-sm font-extrabold text-white shadow-lift transition-colors",
              added ? "bg-mint" : "bg-brand hover:bg-rose-700"
            )}
          >
            {added ? (
              <motion.span
                key="added"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" aria-hidden /> Added!
              </motion.span>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" aria-hidden />
                Add {qty > 1 ? `${qty} ` : ""}to Cart ·{" "}
                {formatINR(product.price * qty)}
              </>
            )}
          </motion.button>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-[11px] font-semibold text-stone-400">
          <Sparkles className="h-3 w-3 text-gold" aria-hidden />
          Personalise your gift message at the combo builder or checkout
        </p>
      </div>
    </div>
  );
}
