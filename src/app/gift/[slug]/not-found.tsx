import Link from "next/link";
import { Flower2, SearchX } from "lucide-react";

export default function GiftNotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 text-center">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-dotted" />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-100/60 via-transparent to-transparent dark:from-rose-950/30"
      />
      <div className="relative">
        <span className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-brand shadow-lift dark:bg-rose-950/50 dark:text-rose-300">
          <SearchX className="h-9 w-9" aria-hidden />
        </span>
        <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
          This gift bloomed away
        </h1>
        <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
          The link may be old or the gift has been retired — but there are hundreds more waiting to
          make someone&apos;s day.
        </p>
        <Link
          href="/#bestsellers"
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
        >
          <Flower2 className="h-4 w-4" aria-hidden />
          Browse bestsellers
        </Link>
      </div>
    </div>
  );
}
