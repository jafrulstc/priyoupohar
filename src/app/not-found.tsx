"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Flower2, SearchX, Home, ArrowRight } from "lucide-react";
import Header from "@/components/shop/header";
import MobileNav from "@/components/shop/mobile-nav";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-background pb-[72px] md:pb-0">
      <Header />
      <div className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 text-center">
        {/* Background decorations */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-dotted opacity-50" />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-b from-rose-100/60 via-transparent to-transparent dark:from-rose-950/30"
        />

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative"
        >
          {/* Animated 404 number */}
          <motion.p
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
            className="text-[8rem] font-black leading-none text-rose-100 dark:text-rose-950/60 sm:text-[10rem]"
            aria-hidden
          >
            404
          </motion.p>

          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 18, delay: 0.2 }}
            className="-mt-16 mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-soft text-brand shadow-lift dark:bg-rose-950/50 dark:text-rose-300"
          >
            <SearchX className="h-9 w-9" aria-hidden />
          </motion.div>

          <h1 className="mt-6 text-3xl font-extrabold tracking-tight text-foreground">
            Oops, wrong turn!
          </h1>
          <p className="mx-auto mt-2 max-w-sm text-sm text-stone-500 dark:text-stone-400">
            The page you&apos;re looking for doesn&apos;t exist — but our bestsellers are just a click away.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-brand px-7 py-3.5 text-sm font-extrabold text-white shadow-lift transition hover:opacity-90"
            >
              <Home className="h-4 w-4" aria-hidden />
              Back to Home
            </Link>
            <Link
              href="/#bestsellers"
              className="inline-flex items-center gap-2 rounded-full border-2 border-brand px-7 py-3.5 text-sm font-extrabold text-brand transition hover:bg-brand hover:text-white"
            >
              <Flower2 className="h-4 w-4" aria-hidden />
              Browse Bestsellers
            </Link>
          </div>
        </motion.div>
      </div>
      <MobileNav />
    </div>
  );
}
