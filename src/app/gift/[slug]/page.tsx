import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  fetchFastApi,
  mapProduct,
  type FastApiProduct,
  type LegacyProduct,
} from "@/lib/product-map";
import { formatINR } from "@/lib/format";
import GiftPageHeader from "@/components/shop/gift-page-header";
import GiftPageActions from "@/components/shop/gift-page-actions";
import ProductReviews from "@/components/shop/product-reviews";
import YouMayAlsoLike from "@/components/shop/you-may-also-like";
import ScrollProgress from "@/components/shop/scroll-progress";
import BackToTop from "@/components/shop/back-to-top";
import MobileNav from "@/components/shop/mobile-nav";
import SearchOverlay from "@/components/shop/search-overlay";
import ProductQuickView from "@/components/shop/product-quick-view";
import CartDrawer from "@/components/shop/cart-drawer";
import WishlistDrawer from "@/components/shop/wishlist-drawer";

export const dynamic = "force-dynamic";

async function getProduct(slug: string): Promise<LegacyProduct | null> {
  const body = await fetchFastApi<{ items: FastApiProduct[] }>(
    `/api/store/products?slug=${encodeURIComponent(slug)}&limit=1`
  );
  const item = body?.items?.[0];
  return item ? mapProduct(item) : null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Gift not found \u00B7 Bloom & Bliss" };
  const off = Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100));
  const blurb = `${product.description.slice(0, 140)} \u00B7 ${formatINR(product.price)}${off > 0 ? ` (${off}% off)` : ""}${product.sameDay ? " \u00B7 Same-day delivery" : ""}`;
  return {
    title: `${product.name} \u2014 ${formatINR(product.price)} \u00B7 Bloom & Bliss`,
    description: blurb,
    openGraph: {
      title: `${product.name} \u00B7 Bloom & Bliss`,
      description: blurb,
      type: "website",
      siteName: "Bloom & Bliss",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} \u00B7 Bloom & Bliss`,
      description: blurb,
    },
    alternates: { canonical: `/gift/${product.slug}` },
  };
}

export default async function GiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background pb-[72px] md:pb-0">
      <ScrollProgress />
      {/* Background decorations */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-gradient-to-b from-rose-100/60 via-transparent to-transparent dark:from-rose-950/20"
      />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 bg-dotted opacity-[0.5]"
      />

      <GiftPageHeader
        productName={product.name}
        productPrice={product.price}
        productImage={product.image}
        productId={product.id}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-4 pb-6 sm:px-6 sm:pb-10 lg:px-8 lg:pb-14">
        <GiftPageActions product={product} />
        <ProductReviews rating={product.rating} count={product.reviews} productId={product.id} />
        <YouMayAlsoLike currentSlug={product.slug} currentCategory={product.category ?? undefined} />
      </div>

      {/* Overlays */}
      <BackToTop />
      <MobileNav />
      <SearchOverlay />
      <ProductQuickView />
      <CartDrawer />
      <WishlistDrawer />
    </div>
  );
}
