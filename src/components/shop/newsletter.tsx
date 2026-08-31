"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  AnimatePresence,
  motion,
  useAnimationControls,
  type Transition,
} from "framer-motion";
import { Check, Copy, Loader2 } from "lucide-react";
import { Lottie } from "lottie-react";
import celebrationAnim from "@/lib/lottie/celebration.json";
import { celebrationConfetti } from "@/lib/confetti";
import { useToast } from "@/hooks/use-toast";
import SpinToWin from "@/components/shop/spin-to-win";

type Status = "idle" | "loading" | "success";

const COUPON = "BLISS10";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SPRING: Transition = { type: "spring", stiffness: 300, damping: 24 };

/** Dark celebratory newsletter card: validate → fake submit → coupon reveal. */
export default function Newsletter() {
  const { toast } = useToast();
  const [status, setStatus] = useState<Status>("idle");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const shakeControls = useAnimationControls();
  const timerRef = useRef<number | null>(null);

  /* Clear the fake-submit timer if we unmount mid-flight */
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (status === "loading") return;

    if (!EMAIL_RE.test(email.trim())) {
      setError("Hmm, that email looks off — try again?");
      void shakeControls.start({
        x: [0, -10, 10, -8, 8, -4, 4, 0],
        transition: { duration: 0.45 },
      });
      return;
    }

    setError(null);
    setStatus("loading");
    /* Simulated subscribe call */
    timerRef.current = window.setTimeout(() => {
      setStatus("success");
      celebrationConfetti();
    }, 900);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(COUPON);
      setCopied(true);
      toast({ title: "Code copied!" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({
        title: "Couldn't auto-copy",
        description: `No worries — the code is simply ${COUPON}.`,
      });
    }
  };

  return (
    <section
      aria-label="Newsletter signup and rewards wheel"
      className="py-16 max-w-6xl mx-auto px-4 md:px-8"
    >
      <div className="relative overflow-hidden rounded-[2.5rem] bg-charcoal text-cream p-8 md:p-12 text-center shadow-lift">
        {/* Decorative blobs + dotted texture */}
        <motion.div
          aria-hidden="true"
          className="absolute -top-20 -left-24 h-72 w-72 rounded-full bg-brand blur-3xl opacity-25 animate-float"
        />
        <motion.div
          aria-hidden="true"
          className="absolute -bottom-24 -right-20 h-80 w-80 rounded-full bg-gold blur-3xl opacity-25 animate-float"
          style={{ animationDelay: "1.6s" }}
        />
        <div aria-hidden="true" className="absolute inset-0 bg-dotted opacity-[0.07]" />

        <div className="relative z-10 grid items-center gap-12 md:grid-cols-[1.05fr_auto_1fr] md:gap-0">
          {/* LEFT — Celebration Club signup */}
          <div className="min-w-0">
          <AnimatePresence mode="wait">
            {status !== "success" ? (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: SPRING }}
                exit={{ opacity: 0, y: -16, transition: { duration: 0.2 } }}
              >
                <h2 className="text-2xl md:text-4xl font-extrabold tracking-tight">
                  Join the <span className="text-gradient-brand">Celebration</span> Club
                </h2>
                <p className="mt-3 text-stone-300 text-sm md:text-base max-w-md mx-auto">
                  Early access to festive drops, secret discounts &amp; a free
                  upgrade on your first order.
                </p>

                <motion.form
                  onSubmit={handleSubmit}
                  animate={shakeControls}
                  noValidate
                  className="mt-8 flex flex-col items-center gap-3"
                >
                  <div className="flex w-full max-w-md flex-col sm:flex-row items-center justify-center gap-3">
                    <label htmlFor="newsletter-email" className="sr-only">
                      Email address
                    </label>
                    <input
                      id="newsletter-email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (error) setError(null);
                      }}
                      aria-invalid={error ? "true" : undefined}
                      aria-describedby={error ? "newsletter-error" : undefined}
                      className="rounded-full bg-white/10 border border-white/15 px-5 py-3 text-sm w-full max-w-md text-cream placeholder:text-stone-400 outline-none focus:border-brand focus:ring-2 focus:ring-brand/40 transition"
                    />
                    <button
                      type="submit"
                      disabled={status === "loading"}
                      className="shrink-0 inline-flex items-center justify-center gap-2 bg-gradient-brand rounded-full px-6 py-3 font-bold text-white hover:opacity-90 active:scale-95 transition disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {status === "loading" ? (
                        <Loader2 size={18} className="animate-spin" aria-hidden="true" />
                      ) : null}
                      {status === "loading" ? "Joining…" : "Get 10% off 🎁"}
                    </button>
                  </div>

                  {error ? (
                    <p
                      id="newsletter-error"
                      role="alert"
                      className="text-rose-300 text-xs font-semibold"
                    >
                      {error}
                    </p>
                  ) : null}
                </motion.form>

                <p className="mt-6 text-stone-400 text-xs">
                  No spam, only smiles. Unsubscribe anytime.
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1, transition: SPRING }}
                exit={{ opacity: 0, transition: { duration: 0.2 } }}
                className="py-2"
              >
                <Lottie
                  src={celebrationAnim}
                  loop={false}
                  className="w-40 h-40 mx-auto"
                  aria-hidden="true"
                />
                <h3 className="text-2xl md:text-3xl font-extrabold mt-2">
                  Welcome to the club! 🎉
                </h3>
                <p className="mt-2 text-stone-300 text-sm md:text-base">
                  Your code is live — 10% off your first celebration.
                </p>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                  <span className="rounded-full border-2 border-dashed border-gold text-gold font-mono font-bold px-5 py-2 tracking-[0.15em]">
                    {COUPON}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    aria-label={`Copy coupon code ${COUPON}`}
                    className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-bold hover:bg-white/20 active:scale-95 transition"
                  >
                    {copied ? (
                      <Check size={16} className="text-mint" aria-hidden="true" />
                    ) : (
                      <Copy size={16} aria-hidden="true" />
                    )}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                <p className="mt-6 text-stone-400 text-xs">
                  No spam, only smiles. Unsubscribe anytime.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
          </div>

          {/* MIDDLE — hairline divider (desktop) */}
          <div
            aria-hidden="true"
            className="hidden md:block relative mx-6 h-72 w-px self-center bg-gradient-to-b from-transparent via-white/20 to-transparent"
          >
            <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 grid h-10 w-10 place-items-center rounded-full border border-white/15 bg-charcoal text-lg">
              💝
            </span>
          </div>

          {/* RIGHT — Spin-to-win reward wheel */}
          <div className="min-w-0">
            <SpinToWin />
          </div>
        </div>
      </div>
    </section>
  );
}
