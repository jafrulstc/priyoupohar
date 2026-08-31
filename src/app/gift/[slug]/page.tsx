import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import {
  Star,
  Truck,
  MoonStar,
  ShieldCheck,
  Gift,
  Flower2,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { db } from "@/lib/db";
import { formatINR } from "@/lib/format";

export const dynamic = "force-dynamic";

async function getProduct(slug: string) {
  try {
    return await db.product.findUnique({ where: { slug } });
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) return { title: "Gift not found · Bloom & Bliss" };
  const off = Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100));
  const blurb = `${product.description.slice(0, 140)} · ${formatINR(product.price)}${off > 0 ? ` (${off}% off)` : ""}${product.sameDay ? " · Same-day delivery" : ""}`;
  return {
    title: `${product.name} — ${formatINR(product.price)} · Bloom & Bliss`,
    description: blurb,
    openGraph: {
      title: `${product.name} · Bloom & Bliss`,
      description: blurb,
      type: "website",
      siteName: "Bloom & Bliss",
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} · Bloom & Bliss`,
      description: blurb,
    },
    alternates: { canonical: `/gift/${product.slug}` },
  };
}

const CATEGORY_LABEL: Record<string, string> = {
  flowers: "Fresh Flowers",
  cakes: "Cakes",
  personalised: "Personalised",
  plants: "Green Gifts",
  combos: "Curated Combo",
};

export default async function GiftPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getProduct(slug);
  if (!product) notFound();

  const off = Math.max(0, Math.round(((product.mrp - product.price) / product.mrp) * 100));

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-background">
      {/* brand wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-100/70 via-transparent to-transparent dark:from-rose-950/30"
      />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dotted" />

      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-sm font-extrabold text-foreground transition-colors hover:text-brand dark:hover:text-rose-400"
        >
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white shadow-lift">
            <Flower2 className="h-4.5 w-4.5" aria-hidden />
          </span>
          Bloom &amp; Bliss
        </Link>
        <span className="hidden items-center gap-1.5 rounded-full border border-rose-100 bg-card px-3 py-1.5 text-[11px] font-bold text-stone-500 shadow-soft dark:border-stone-700 dark:text-stone-400 sm:flex">
          <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden />
          A gift worth sharing
        </span>
      </header>

      <main className="relative z-10 mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-5 pb-16 pt-4 md:grid-cols-2 md:pb-24">
        {/* Photo */}
        <div className="relative mx-auto w-full max-w-md">
          <div
            aria-hidden
            className="absolute -inset-3 -rotate-3 rounded-[2rem] bg-gradient-brand opacity-20 blur-xl"
          />
          <div className="relative rotate-[-2deg] rounded-[2rem] border-8 border-white bg-white shadow-lift transition-transform duration-500 hover:rotate-0 dark:border-stone-800 dark:bg-stone-800">
            <Image
              src={product.image}
              alt={product.name}
              width={640}
              height={640}
              priority
              className="aspect-square w-full rounded-[1.4rem] object-cover"
            />
            {product.tag && (
              <span className="absolute left-4 top-4 rounded-full bg-gold px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-charcoal shadow-soft">
                {product.tag}
              </span>
            )}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-brand dark:text-rose-400">
            {CATEGORY_LABEL[product.category] ?? "Handpicked Gift"}
          </p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
            <span className="inline-flex items-center gap-1 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-extrabold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
              <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
              {product.rating.toFixed(1)}
            </span>
            <span className="text-xs font-semibold text-stone-400">
              {product.reviews.toLocaleString("en-IN")} happy reviews
            </span>
          </div>

          <p className="mt-4 max-w-md text-sm leading-relaxed text-stone-500 dark:text-stone-400">
            {product.description}
          </p>

          <div className="mt-5 flex items-end gap-3">
            <span className="text-4xl font-extrabold tracking-tight text-foreground">
              {formatINR(product.price)}
            </span>
            {off > 0 && (
              <>
                <span className="pb-1 text-base font-bold text-stone-400 line-through">
                  {formatINR(product.mrp)}
                </span>
                <span className="mb-1 rounded-full bg-mint/15 px-2 py-0.5 text-xs font-extrabold text-mint">
                  {off}% OFF
                </span>
              </>
            )}
          </div>

          <div className="mt-5 flex flex-wrap gap-2 text-[11px] font-bold">
            {product.sameDay && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand dark:bg-rose-950/50 dark:text-rose-300">
                <Truck className="h-3.5 w-3.5" aria-hidden /> Same-day in ~4 hrs
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand dark:bg-rose-950/50 dark:text-rose-300">
              <MoonStar className="h-3.5 w-3.5" aria-hidden /> Midnight delivery
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand dark:bg-rose-950/50 dark:text-rose-300">
              <Gift className="h-3.5 w-3.5" aria-hidden /> Free gift wrap &amp; card
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-brand dark:bg-rose-950/50 dark:text-rose-300">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden /> 100% secure
            </span>
          </div>

          <div className="mt-7 flex flex-wrap items-center gap-3">
            <Link
              href={`/?gift=${product.slug}`}
              className="group inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
            >
              Personalize &amp; order this gift
              <ArrowRight
                className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </Link>
            <Link
              href="/#bestsellers"
              className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-card px-5 py-3.5 text-sm font-bold text-foreground transition hover:border-brand hover:text-brand dark:border-stone-700"
            >
              Explore more gifts
            </Link>
          </div>

          <p className="mt-5 text-[11px] font-semibold text-stone-400">
            Hand-delivered across 400+ cities · Free basic gift wrap · Order within the cutoff for
            tonight&apos;s midnight drop
          </p>
        </div>
      </main>
    </div>
  );
}
