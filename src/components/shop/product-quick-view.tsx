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
  ZoomIn,
  ExternalLink,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { formatINR, discountPct, reviewLabel } from "@/lib/format";
import { miniConfetti } from "@/lib/confetti";
import PincodeChecker from "@/components/shop/pincode-checker";
import ImageLightbox from "@/components/shop/image-lightbox";
import Link from "next/link";
import type { Product } from "@/lib/types";
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
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxGen, setLightboxGen] = useState(0);

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
          title: `${product.name} — PriyoUpohar`,
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
        <button
          type="button"
          onClick={() => { setLightboxGen((g) => g + 1); setLightboxOpen(true); }}
          className="absolute inset-0 z-[2] cursor-zoom-in"
          aria-label="Zoom image"
        />
        <motion.img
          initial={{ scale: 1.08, opacity: 0.6 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
          src={product.image}
          alt={product.name}
          className="absolute inset-0 h-full w-full object-cover"
          draggable={false}
        />
        {/* Zoom hint */}
        <span className="pointer-events-none absolute bottom-3 right-3 z-[3] flex items-center gap-1.5 rounded-full bg-charcoal/50 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur-sm">
          <ZoomIn className="h-3 w-3" /> Tap to zoom
        </span>
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
          className="absolute right-4 top-16 grid h-10 w-10 place-items-center rounded-full bg-white/95 shadow-soft transition dark:bg-stone-900/90 hover:scale-110 active:scale-90 sm:top-4"
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
              · {reviewLabel(product.reviews)}
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

        {/* Pairs beautifully with — data-driven add-on rail */}
        <PairsRail product={product} />

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

        {/* View full details link */}
        <Link
          href={`/gift/${product.slug}`}
          onClick={() => useShopStore.getState().setQuickViewProduct(null)}
          className="mt-3 flex items-center justify-center gap-1 text-xs font-bold text-brand transition hover:text-rose-700"
        >
          View full details <ExternalLink className="h-3 w-3" />
        </Link>
      </div>

      {/* Lightbox */}
      <ImageLightbox
        key={lightboxGen}
        images={[product.image]}
        alt={product.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}

/* ---------- "Pairs beautifully with" — companion add-ons ---------- */

function PairsRail({ product }: { product: QuickProduct }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const { toast } = useToast();
  const [pairsData, setPairsData] = useState<{ key: string; items: Product[] }>({
    key: "",
    items: [],
  });
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const pairSlugs = product.pairsWith?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const pairKey = pairSlugs.join(",");

  /* derived: pairs only render when the cached data belongs to THIS product */
  const pairs = pairKey && pairsData.key === pairKey ? pairsData.items : [];

  useEffect(() => {
    if (!pairKey) return;
    const ctrl = new AbortController();
    fetch(`/api/products?slugs=${encodeURIComponent(pairKey)}&limit=4`, {
      signal: ctrl.signal,
    })
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((data: { products?: Product[] }) => {
        setPairsData({ key: pairKey, items: data.products ?? [] });
      })
      .catch(() => {
        /* bonus rail — stay silent on failure */
      });
    return () => ctrl.abort();
  }, [pairKey]);

  if (pairs.length === 0) return null;

  return (
    <div className="mt-3.5 rounded-2xl border border-dashed border-rose-200 bg-rose-50/40 p-3 dark:border-stone-700 dark:bg-stone-900/60">
      <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wide text-brand dark:text-rose-300">
        <Heart className="h-3 w-3 fill-brand text-brand dark:fill-rose-400 dark:text-rose-400" aria-hidden />
        Pairs beautifully with
      </p>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {pairs.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 * i, type: "spring", stiffness: 280, damping: 24 }}
            className="group flex items-center gap-2 rounded-xl bg-card p-1.5 shadow-soft dark:bg-stone-800"
          >
            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg">
              <img
                src={p.image}
                alt={p.name}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="line-clamp-1 text-[11px] font-bold leading-tight text-foreground">
                {p.name}
              </p>
              <p className="text-[11px] font-extrabold text-brand dark:text-rose-400">
                {formatINR(p.price)}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                miniConfetti({
                  x: (rect.left + rect.width / 2) / window.innerWidth,
                  y: rect.top / window.innerHeight,
                });
                addToCart({
                  id: p.id,
                  name: p.name,
                  price: p.price,
                  mrp: p.mrp,
                  image: p.image,
                  category: p.category,
                });
                setAddedIds((m) => ({ ...m, [p.id]: true }));
                toast({
                  title: `${p.name} added 🛍️`,
                  description: "Perfect match — your gift just got better.",
                });
                window.setTimeout(
                  () => setAddedIds((m) => ({ ...m, [p.id]: false })),
                  1500
                );
              }}
              aria-label={`Add ${p.name} to bag`}
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full text-white shadow-lift transition-colors",
                addedIds[p.id] ? "bg-mint" : "bg-brand hover:bg-rose-700"
              )}
            >
              {addedIds[p.id] ? (
                <Check className="h-3.5 w-3.5" aria-hidden />
              ) : (
                <Plus className="h-3.5 w-3.5" aria-hidden />
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
