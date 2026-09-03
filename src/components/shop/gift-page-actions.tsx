"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import ImageLightbox from "@/components/shop/image-lightbox";
import {
  Star,
  Truck,
  MoonStar,
  ShieldCheck,
  Gift,
  Heart,
  Plus,
  Check,
  Minus,
  ShoppingBag,
  ArrowRight,
  Share2,
  ChevronRight,
  ZoomIn,
} from "lucide-react";
import { useShopStore, type ProductSnapshot } from "@/lib/store";
import { formatINR, reviewLabel } from "@/lib/format";
import { miniConfetti, petalConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";
import type { LegacyProduct } from "@/lib/product-map";
import type { Product } from "@/lib/types";

/* ------------------------------------------------------------------ */
/* Pairs Rail — reusable companion suggestions                        */
/* ------------------------------------------------------------------ */
function PairsRail({ product }: { product: { pairsWith?: string | null } }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const { toast } = useToast();
  const [pairsData, setPairsData] = useState<{ key: string; items: Product[] }>({
    key: "",
    items: [],
  });
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  const pairSlugs =
    product.pairsWith?.split(",").map((s) => s.trim()).filter(Boolean) ?? [];
  const pairKey = pairSlugs.join(",");
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
      .catch(() => {});
    return () => ctrl.abort();
  }, [pairKey]);

  if (pairs.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ type: "spring", stiffness: 260, damping: 24 }}
      className="mt-12 rounded-3xl border border-dashed border-rose-200 bg-rose-50/50 p-5 dark:border-stone-700 dark:bg-stone-900/60"
    >
      <p className="flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-brand dark:text-rose-300">
        <Heart className="h-4 w-4 fill-brand text-brand dark:fill-rose-400 dark:text-rose-400" aria-hidden />
        Pairs beautifully with
      </p>
      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {pairs.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.06 * i, type: "spring", stiffness: 280, damping: 24 }}
            className="group flex items-center gap-2.5 rounded-2xl bg-card p-2.5 shadow-soft transition-shadow hover:shadow-lift dark:bg-stone-800"
          >
            <Link
              href={`/gift/${p.slug}`}
              className="h-14 w-14 shrink-0 overflow-hidden rounded-xl"
            >
              <Image
                src={p.image}
                alt={p.name}
                width={56}
                height={56}
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </Link>
            <div className="min-w-0 flex-1">
              <Link href={`/gift/${p.slug}`} className="block">
                <p className="line-clamp-1 text-xs font-bold leading-tight text-foreground hover:text-brand">
                  {p.name}
                </p>
              </Link>
              <p className="mt-0.5 text-xs font-extrabold text-brand dark:text-rose-400">
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
                setTimeout(() => setAddedIds((m) => ({ ...m, [p.id]: false })), 1500);
              }}
              aria-label={`Add ${p.name} to bag`}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-white shadow-lift transition-colors"
              style={{
                backgroundColor: addedIds[p.id] ? "var(--mint)" : "var(--brand)",
              }}
            >
              {addedIds[p.id] ? (
                <Check className="h-4 w-4" aria-hidden />
              ) : (
                <Plus className="h-4 w-4" aria-hidden />
              )}
            </motion.button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/* Trust badges strip                                                  */
/* ------------------------------------------------------------------ */
const TRUST_BADGES = [
  { icon: Truck, label: "Same-day in ~4 hrs", condition: (p: LegacyProduct) => p.sameDay },
  { icon: MoonStar, label: "Midnight delivery", condition: () => true },
  { icon: Gift, label: "Free gift wrap & card", condition: () => true },
  { icon: ShieldCheck, label: "100% secure", condition: () => true },
];

/* ------------------------------------------------------------------ */
/* Main Gift Page Actions (client component)                           */
/* ------------------------------------------------------------------ */
export default function GiftPageActions({ product }: { product: LegacyProduct }) {
  const addToCart = useShopStore((s) => s.addToCart);
  const toggleWishlist = useShopStore((s) => s.toggleWishlist);
  const wishlist = useShopStore((s) => s.wishlist);
  const pushRecentlyViewed = useShopStore((s) => s.pushRecentlyViewed);
  const { toast } = useToast();

  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [lightboxGen, setLightboxGen] = useState(0);
  const [selectedImgIdx, setSelectedImgIdx] = useState(0);

  const allImages = product.gallery && product.gallery.length > 0
    ? [product.image, ...product.gallery]
    : [product.image];
  const currentImage = allImages[selectedImgIdx] ?? product.image;
  const isWishlisted = wishlist.some((w) => w.id === product.id);
  const btnRef = useRef<HTMLButtonElement>(null);

  const snapshot: ProductSnapshot = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    category: product.category ?? "",
    price: product.price,
    mrp: product.mrp,
    image: product.image,
    rating: product.rating,
    reviews: product.reviews,
    tag: product.tag,
    sameDay: product.sameDay,
    description: product.description,
    pairsWith: product.pairsWith,
  };

  /* Track recently viewed */
  useEffect(() => {
    pushRecentlyViewed(snapshot);
  }, [product.id, snapshot]);

  const off = Math.max(
    0,
    Math.round(((product.mrp - product.price) / product.mrp) * 100)
  );

  const handleAddToCart = useCallback(() => {
    const rect = btnRef.current?.getBoundingClientRect();
    miniConfetti(
      rect
        ? { x: (rect.left + rect.width / 2) / window.innerWidth, y: rect.top / window.innerHeight }
        : undefined
    );
    addToCart(
      {
        id: product.id,
        name: product.name,
        price: product.price,
        mrp: product.mrp,
        image: product.image,
        category: product.category ?? "",
        slug: product.slug,
      },
      qty
    );
    setAdded(true);
    toast({
      title: `${product.name} added to gift bag! ✨`,
      description: qty > 1 ? `${qty} items added` : undefined,
    });
    setTimeout(() => setAdded(false), 1800);
  }, [addToCart, product, qty, toast]);

  const handleWishlist = useCallback(() => {
    toggleWishlist(snapshot);
    const willBeWishlisted = !isWishlisted;
    toast({
      title: willBeWishlisted
        ? `${product.name} saved to wishlist ❤️`
        : `Removed from wishlist`,
    });
    if (willBeWishlisted) petalConfetti();
  }, [toggleWishlist, snapshot, isWishlisted, product.name, toast]);

  const handleShare = useCallback(async () => {
    const url = window.location.href;
    const text = `${product.name} — ${formatINR(product.price)} | Bloom & Bliss`;
    try {
      await navigator.share({ title: product.name, text, url });
    } catch (err) {
      if ((err as DOMException).name !== "AbortError") {
        try {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          toast({ title: "Link copied! 🔗" });
        } catch {
          toast({ title: "Sharing not available", description: "Try copying the URL manually.", variant: "destructive" });
        }
      }
    }
  }, [product.name, product.price, toast]);

  return (
    <>
      {/* Desktop layout */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-12">
        {/* Image gallery */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-lg"
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -inset-4 -rotate-2 rounded-[2.5rem] bg-gradient-brand opacity-15 blur-2xl"
          />
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => { setLightboxIdx(selectedImgIdx); setLightboxGen((g) => g + 1); setLightboxOpen(true); }}
            aria-label="Open image gallery"
            className="block w-full cursor-zoom-in"
          >
          <div className="relative overflow-hidden rounded-[2rem] border-[6px] border-white bg-white shadow-lift transition-all duration-500 hover:shadow-[0_25px_50px_-12px_rgba(225,29,72,0.2)] dark:border-stone-800 dark:bg-stone-800">
            <div className="relative aspect-square">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedImgIdx}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0"
                >
                  <Image
                    src={currentImage}
                    alt={`${product.name} — image ${selectedImgIdx + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    priority={selectedImgIdx === 0}
                    className="object-cover"
                  />
                </motion.div>
              </AnimatePresence>
              {product.tag && (
                <span className="absolute left-4 top-4 rounded-full bg-gold px-3.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-charcoal shadow-soft">
                  {product.tag}
                </span>
              )}
              {/* Image counter badge */}
              {allImages.length > 1 && (
                <span className="absolute bottom-3 left-3 z-10 flex items-center gap-1 rounded-full bg-charcoal/50 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm">
                  <ZoomIn className="h-3 w-3" aria-hidden />
                  {selectedImgIdx + 1} / {allImages.length}
                </span>
              )}
              {/* Wishlist heart overlay */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={handleWishlist}
                aria-label={isWishlisted ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-stone-400 shadow-soft backdrop-blur-sm transition-colors hover:text-brand dark:bg-stone-900/90 dark:text-stone-300 dark:hover:text-rose-400"
              >
                <Heart
                  className="h-5 w-5"
                  aria-hidden
                  style={{
                    fill: isWishlisted ? "var(--brand)" : "none",
                    color: isWishlisted ? "var(--brand)" : undefined,
                  }}
                />
              </motion.button>
            </div>
          </div>
          </motion.button>
          {/* Gallery thumbnails */}
          {allImages.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-slim">
              {allImages.map((img, i) => (
                <motion.button
                  key={i}
                  type="button"
                  whileTap={{ scale: 0.92 }}
                  onClick={() => setSelectedImgIdx(i)}
                  className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-200 ${i === selectedImgIdx ? "border-brand shadow-soft ring-2 ring-brand/20" : "border-transparent opacity-60 hover:opacity-100"}`}
                  aria-label={`View ${product.name} image ${i + 1}`}
                  aria-pressed={i === selectedImgIdx}
                >
                  <Image
                    src={img}
                    alt={`${product.name} view ${i + 1}`}
                    width={64}
                    height={64}
                    className="h-full w-full object-cover"
                  />
                  {i === selectedImgIdx && (
                    <motion.div
                      layoutId="gallery-active-indicator"
                      className="absolute inset-0 rounded-[10px] border-2 border-brand"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Product details */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22, delay: 0.08 }}
          className="flex flex-1 flex-col"
        >
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-3 flex items-center gap-1 text-xs text-stone-400">
            <Link href="/" className="hover:text-brand transition-colors">Home</Link>
            <ChevronRight className="h-3 w-3" aria-hidden />
            <Link href={`/#bestsellers`} className="hover:text-brand transition-colors">Gifts</Link>
            {product.category && (
              <>
                <ChevronRight className="h-3 w-3" aria-hidden />
                <span className="capitalize text-stone-500 dark:text-stone-400">{product.category}</span>
              </>
            )}
          </nav>

          {/* Category label */}
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand dark:text-rose-400"
          >
            {product.category ? product.category.replace(/-/g, " ") : "Handpicked Gift"}
          </motion.p>

          {/* Title */}
          <h1 className="mt-1.5 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {product.name}
          </h1>

          {/* Rating */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-3 flex flex-wrap items-center gap-2.5 text-sm"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gold-soft px-3 py-1.5 text-xs font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-stone-400">
              {reviewLabel(product.reviews, { noun: "happy review" })}
            </span>
          </motion.div>

          {/* Description */}
          <p className="mt-4 max-w-lg text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {product.description}
          </p>

          {/* Price block */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="mt-5 flex items-end gap-3"
          >
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {formatINR(product.price)}
            </span>
            {off > 0 && (
              <>
                <span className="pb-1.5 text-lg font-bold text-stone-400 line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="mb-1.5 rounded-full bg-mint/15 px-2.5 py-1 text-xs font-extrabold text-mint">
                  {off}% OFF
                </span>
              </>
            )}
          </motion.div>

          {/* Stock indicator */}
          {product.stock <= 5 && product.stock > 0 && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-2 text-xs font-bold text-amber-600 dark:text-amber-400"
            >
              Only {product.stock} left in stock — order soon!
            </motion.p>
          )}

          {/* Trust badges */}
          <div className="mt-5 flex flex-wrap gap-2">
            {TRUST_BADGES.filter((b) => b.condition(product)).map((b) => (
              <span
                key={b.label}
                className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-[11px] font-bold text-brand dark:bg-rose-950/50 dark:text-rose-300"
              >
                <b.icon className="h-3.5 w-3.5" aria-hidden />
                {b.label}
              </span>
            ))}
          </div>

          {/* Quantity + Actions */}
          <div className="mt-7 flex flex-wrap items-center gap-3">
            {/* Quantity stepper */}
            <div className="flex items-center overflow-hidden rounded-full border border-stone-200 bg-card shadow-soft dark:border-stone-700">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                disabled={qty <= 1}
                aria-label="Decrease quantity"
                className="grid h-11 w-11 place-items-center text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
              <span className="flex h-11 w-10 items-center justify-center text-sm font-extrabold tabular-nums">
                {qty}
              </span>
              <button
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                disabled={qty >= 10}
                aria-label="Increase quantity"
                className="grid h-11 w-11 place-items-center text-stone-500 transition-colors hover:bg-stone-100 disabled:opacity-30 dark:hover:bg-stone-800"
              >
                <Plus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Add to Cart button */}
            <motion.button
              ref={btnRef}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="group relative flex-1 items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-brand px-8 py-3.5 text-sm font-extrabold text-white shadow-lift transition-all hover:shadow-[0_20px_40px_-12px_rgba(225,29,72,0.4)] disabled:opacity-50 disabled:shadow-none sm:flex-none sm:px-10"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="h-4.5 w-4.5" aria-hidden />
                    Added!
                  </motion.span>
                ) : (
                  <motion.span
                    key="add"
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingBag className="h-4.5 w-4.5" aria-hidden />
                    Add to Gift Bag
                  </motion.span>
                )}
              </AnimatePresence>
              {product.stock === 0 && (
                <span className="absolute inset-0 flex items-center justify-center bg-charcoal/60 text-xs font-bold text-white">
                  Out of stock
                </span>
              )}
            </motion.button>
          </div>

          {/* Secondary actions row */}
          <div className="mt-4 flex items-center gap-3">
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-card px-4 py-2.5 text-xs font-bold text-brand transition-colors hover:bg-rose-50 dark:border-stone-700 dark:text-rose-300 dark:hover:bg-stone-800"
            >
              <Heart
                className="h-3.5 w-3.5"
                aria-hidden
                style={{
                  fill: isWishlisted ? "currentColor" : "none",
                }}
              />
              {isWishlisted ? "Wishlisted" : "Wishlist"}
            </motion.button>

            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={handleShare}
              aria-label="Share this gift"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-card px-4 py-2.5 text-xs font-bold text-stone-600 transition-colors hover:border-brand hover:text-brand dark:border-stone-700 dark:text-stone-400"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden />
              Share
            </motion.button>

            <Link
              href={`/?gift=${product.slug}`}
              className="ml-auto inline-flex items-center gap-1 text-xs font-bold text-stone-400 transition-colors hover:text-brand dark:text-stone-500"
            >
              Personalize & order
              <ArrowRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
          </div>

          {/* Delivery info */}
          <p className="mt-6 text-[11px] font-semibold leading-relaxed text-stone-400 dark:text-stone-500">
            Hand-delivered across 400+ cities · Free basic gift wrap · Order
            within the cutoff for tonight&apos;s midnight drop
          </p>

          {/* Pairs Rail */}
          <PairsRail product={product} />
        </motion.div>
      </div>

      {/* Image lightbox */}
      <ImageLightbox
        key={lightboxGen}
        images={allImages}
        alt={product.name}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        initialIndex={lightboxIdx}
      />

      {/* Mobile sticky CTA bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rose-100 bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden dark:border-stone-800">
        <div className="mx-auto flex h-16 max-w-lg items-center justify-between gap-3 px-4">
          <div className="min-w-0">
            <p className="line-clamp-1 text-xs font-bold text-foreground">{product.name}</p>
            <div className="flex items-center gap-2">
              <span className="text-lg font-extrabold text-foreground">{formatINR(product.price)}</span>
              {off > 0 && (
                <span className="text-xs font-bold text-stone-400 line-through">{formatINR(product.mrp)}</span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Mobile wishlist */}
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleWishlist}
              aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
              className="grid h-11 w-11 place-items-center rounded-full border border-stone-200 bg-card dark:border-stone-700"
            >
              <Heart
                className="h-5 w-5"
                aria-hidden
                style={{
                  fill: isWishlisted ? "var(--brand)" : "none",
                  color: isWishlisted ? "var(--brand)" : undefined,
                }}
              />
            </motion.button>
            {/* Mobile add to cart */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
              className="flex items-center gap-2 rounded-full bg-gradient-brand px-6 py-2.5 text-sm font-extrabold text-white shadow-lift disabled:opacity-50"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span
                    key="added-m"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0.8 }}
                  >
                    <Check className="h-5 w-5" aria-hidden />
                  </motion.span>
                ) : (
                  <motion.span key="add-m" initial={{ scale: 0.8 }} animate={{ scale: 1 }} exit={{ scale: 0.8 }}>
                    <ShoppingBag className="h-5 w-5" aria-hidden />
                  </motion.span>
                )}
              </AnimatePresence>
              Add
            </motion.button>
          </div>
        </div>
      </div>
      {/* Spacer for sticky bar on mobile */}
      <div className="h-16 lg:hidden" aria-hidden />
    </>
  );
}
