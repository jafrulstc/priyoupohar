"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useAnimationControls, type Transition } from "framer-motion";
import { Copy, Check, Dices, Clock3, PartyPopper } from "lucide-react";
import { useShopStore } from "@/lib/store";
import { useMounted } from "@/hooks/use-mounted";
import { useToast } from "@/hooks/use-toast";
import { celebrationConfetti } from "@/lib/confetti";
import { resolveCoupon } from "@/lib/coupons";
import { cn } from "@/lib/utils";

const SPIN_COOLDOWN_MS = 24 * 60 * 60 * 1000;

type Segment = {
  label: string;
  win: boolean;
  code: string; // coupon code when win, "" otherwise
  bg: string; // segment fill
  fg: string; // label colour
};

/* 8 segments, clockwise from 12 o'clock */
const SEGMENTS: Segment[] = [
  { label: "15% OFF", win: true, code: "SPIN15", bg: "#E11D48", fg: "#FFFFFF" },
  { label: "₹50 OFF", win: true, code: "JOY50", bg: "#F59E0B", fg: "#292524" },
  { label: "TRY AGAIN", win: false, code: "", bg: "#9F1239", fg: "#FECDD3" },
  { label: "FREE SHIP", win: true, code: "SHIPFREE", bg: "#FBBF24", fg: "#292524" },
  { label: "10% OFF", win: true, code: "BLISS10", bg: "#E11D48", fg: "#FFFFFF" },
  { label: "BETTER LUCK", win: false, code: "", bg: "#B45309", fg: "#FDE68A" },
  { label: "₹50 OFF", win: true, code: "JOY50", bg: "#F59E0B", fg: "#292524" },
  { label: "SO CLOSE", win: false, code: "", bg: "#9F1239", fg: "#FECDD3" },
];

const SEG_ANGLE = 360 / SEGMENTS.length;
const CENTER = 130;
const RADIUS = 118;
const LABEL_R = 76;

const spinEase: Transition = { duration: 4.6, ease: [0.16, 1, 0.3, 1] };

/** Polar helper: angle measured clockwise from 12 o'clock. */
function polar(angleDeg: number, r: number): [number, number] {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return [CENTER + r * Math.cos(rad), CENTER + r * Math.sin(rad)];
}

function segmentPath(i: number): string {
  const [x1, y1] = polar(i * SEG_ANGLE, RADIUS);
  const [x2, y2] = polar((i + 1) * SEG_ANGLE, RADIUS);
  return `M ${CENTER} ${CENTER} L ${x1} ${y1} A ${RADIUS} ${RADIUS} 0 0 1 ${x2} ${y2} Z`;
}

type Phase = "idle" | "spinning" | "won" | "lost";

/** Festive spin-to-win wheel — 1 free spin / 24h, prizes are real coupons. */
export default function SpinToWin() {
  const mounted = useMounted();
  const { toast } = useToast();
  const spinPrize = useShopStore((s) => s.spinPrize);
  const spinAt = useShopStore((s) => s.spinAt);
  const setSpinResult = useShopStore((s) => s.setSpinResult);

  const [phase, setPhase] = useState<Phase>("idle");
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{ label: string; win: boolean; code: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [, forceTick] = useState(0);
  const pointerControls = useAnimationControls();
  const timerRef = useRef<number | null>(null);

  const paths = useMemo(() => SEGMENTS.map((_, i) => segmentPath(i)), []);
  const cooling = mounted && spinAt > 0 && Date.now() - spinAt < SPIN_COOLDOWN_MS;
  const canSpin = mounted && !cooling && phase !== "spinning";

  /* Keep the cooldown countdown live (30s tick) */
  useEffect(() => {
    if (!cooling) return;
    const id = window.setInterval(() => forceTick((n) => n + 1), 30_000);
    return () => window.clearInterval(id);
  }, [cooling]);

  /* Clear any pending pointer timer on unmount */
  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    []
  );

  const startSpin = () => {
    if (!canSpin) return;
    setCopied(false);
    setResult(null);
    setPhase("spinning");

    const idx = Math.floor(Math.random() * SEGMENTS.length);
    const jitter = (Math.random() - 0.5) * (SEG_ANGLE * 0.7);
    const targetMod = (360 - (idx * SEG_ANGLE + SEG_ANGLE / 2) + jitter + 360) % 360;
    const currentMod = ((rotation % 360) + 360) % 360;
    const delta = (targetMod - currentMod + 360) % 360 + 360 * (5 + Math.floor(Math.random() * 2));
    setRotation(rotation + delta);

    /* Pointer anticipates the click */
    void pointerControls.start({ rotate: [0, -14, 0], transition: { duration: 0.35 } });
  };

  const settle = (seg: Segment) => {
    setPhase(seg.win ? "won" : "lost");
    setSpinResult(seg.win ? { code: seg.code, label: seg.label } : null, Date.now());
    if (seg.win) {
      celebrationConfetti();
      toast({ title: `You won ${seg.label}! 🎉`, description: `Code ${seg.code} is yours.` });
    } else {
      void pointerControls.start({
        rotate: [0, -10, 8, -6, 4, 0],
        transition: { duration: 0.5 },
      });
      timerRef.current = window.setTimeout(() => setPhase("idle"), 4000);
    }
  };

  const handleCopy = async () => {
    if (!result?.code) return;
    try {
      await navigator.clipboard.writeText(result.code);
      setCopied(true);
      toast({ title: "Code copied!" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't auto-copy", description: `The code is simply ${result.code}.` });
    }
  };

  const cooldownLeft = cooling ? SPIN_COOLDOWN_MS - (Date.now() - spinAt) : 0;
  const cooldownLabel = cooldownLeft
    ? `${Math.floor(cooldownLeft / 3600000)}h ${Math.floor((cooldownLeft % 3600000) / 60000)}m`
    : "";

  const lastWinCoupon = mounted && spinPrize ? resolveCoupon(spinPrize.code) : null;

  return (
    <div className="flex flex-col items-center text-center" aria-label="Spin to win rewards">
      {/* Heading */}
      <span className="inline-flex items-center gap-1.5 rounded-full bg-gold/15 border border-gold/30 px-3 py-1 text-[11px] font-extrabold uppercase tracking-widest text-gold">
        <Dices className="h-3.5 w-3.5" aria-hidden /> Play &amp; win
      </span>
      <h3 className="mt-3 text-xl md:text-2xl font-extrabold tracking-tight">
        Spin the <span className="text-gradient-brand">Reward Wheel</span>
      </h3>
      <p className="mt-1.5 text-stone-300 text-xs md:text-sm max-w-xs">
        One free spin every day — discounts, free shipping &amp; more.
      </p>

      {/* Wheel */}
      <div className="relative mt-5 w-[248px] h-[248px] sm:w-[276px] sm:h-[276px]">
        {/* Pointer */}
        <motion.div
          animate={pointerControls}
          className="absolute left-1/2 -top-1.5 z-20 -translate-x-1/2"
          aria-hidden="true"
        >
          <svg width="26" height="30" viewBox="0 0 26 30">
            <path
              d="M13 30 L3 8 Q13 -4 23 8 Z"
              fill="#F59E0B"
              stroke="#78350F"
              strokeWidth="1.5"
            />
            <circle cx="13" cy="9" r="3" fill="#FEF3C7" />
          </svg>
        </motion.div>

        {/* Rim glow */}
        <div
          aria-hidden="true"
          className="absolute -inset-2.5 rounded-full bg-[conic-gradient(from_0deg,#E11D48,#F59E0B,#E11D48,#F59E0B,#E11D48)] opacity-90 blur-[1px]"
        />
        {/* Bulbs */}
        <div aria-hidden="true" className="absolute inset-0 z-10">
          {Array.from({ length: 16 }).map((_, i) => (
            <span
              key={i}
              className="absolute h-1.5 w-1.5 rounded-full bg-amber-200 shadow-[0_0_6px_2px_rgba(251,191,36,0.65)] animate-pulse"
              style={{
                left: `${50 + 49.3 * Math.sin((i / 16) * 2 * Math.PI)}%`,
                top: `${50 - 49.3 * Math.cos((i / 16) * 2 * Math.PI)}%`,
                transform: "translate(-50%,-50%)",
                animationDelay: `${(i % 4) * 0.35}s`,
                animationDuration: "1.6s",
              }}
            />
          ))}
        </div>

        {/* Rotating disc */}
        <motion.svg
          viewBox="0 0 260 260"
          role="img"
          aria-label="Reward wheel with 8 prize segments"
          className="relative z-10 h-full w-full rounded-full"
          animate={{ rotate: rotation }}
          transition={spinEase}
          onAnimationComplete={() => {
            if (phase === "spinning") {
              const idx =
                Math.round(
                  ((360 - (((rotation % 360) + 360) % 360)) % 360) / SEG_ANGLE
                ) % SEGMENTS.length;
              settle(SEGMENTS[idx]);
            }
          }}
        >
          {SEGMENTS.map((seg, i) => (
            <g key={i}>
              <path d={paths[i]} fill={seg.bg} stroke="#FAFAF9" strokeWidth="1.5" />
              <text
                x={CENTER}
                y={CENTER - LABEL_R}
                textAnchor="middle"
                dominantBaseline="middle"
                fill={seg.fg}
                fontSize="12.5"
                fontWeight="800"
                letterSpacing="0.5"
                transform={`rotate(${i * SEG_ANGLE + SEG_ANGLE / 2} ${CENTER} ${CENTER})`}
              >
                {seg.label}
              </text>
            </g>
          ))}
        </motion.svg>

        {/* Hub */}
        <div className="absolute left-1/2 top-1/2 z-20 -translate-x-1/2 -translate-y-1/2">
          <motion.button
            type="button"
            onClick={startSpin}
            disabled={!canSpin}
            whileHover={canSpin ? { scale: 1.08 } : undefined}
            whileTap={canSpin ? { scale: 0.92 } : undefined}
            aria-label={canSpin ? "Spin the wheel" : "Spin unavailable — come back later"}
            className={cn(
              "grid h-16 w-16 place-items-center rounded-full border-4 border-cream bg-charcoal text-2xl shadow-lift transition",
              canSpin ? "cursor-pointer" : "cursor-not-allowed opacity-80"
            )}
          >
            <span aria-hidden="true">{phase === "spinning" ? "🌀" : "🎁"}</span>
            <span className="sr-only">Spin the wheel</span>
          </motion.button>
        </div>
      </div>

      {/* Result / status */}
      <div className="mt-5 min-h-[92px] w-full max-w-xs" aria-live="polite">
        {phase === "won" && result?.code ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 22 }}
            className="flex flex-col items-center gap-2"
          >
            <p className="flex items-center gap-1.5 text-sm font-extrabold text-mint">
              <PartyPopper className="h-4 w-4" aria-hidden /> You won {result.label}!
            </p>
            <div className="flex items-center gap-2">
              <span className="rounded-full border-2 border-dashed border-gold px-4 py-1.5 font-mono text-sm font-bold tracking-[0.15em] text-gold">
                {result.code}
              </span>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={`Copy coupon code ${result.code}`}
                className="grid h-8 w-8 place-items-center rounded-full bg-white/10 transition hover:bg-white/20 active:scale-90"
              >
                {copied ? (
                  <Check size={14} className="text-mint" aria-hidden="true" />
                ) : (
                  <Copy size={14} aria-hidden="true" />
                )}
              </button>
            </div>
            <p className="text-[11px] text-stone-400">
              Valid 24h — apply it in your gift bag at checkout.
            </p>
          </motion.div>
        ) : phase === "lost" ? (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm font-semibold text-stone-300"
          >
            So close! 😤 The wheel resets at midnight — come back &amp; try again.
          </motion.p>
        ) : phase === "spinning" ? (
          <p className="text-sm font-semibold text-stone-300">Spinning the wheel of joy… 🌀</p>
        ) : cooling ? (
          <div className="flex flex-col items-center gap-1.5">
            <p className="flex items-center gap-1.5 text-xs font-bold text-stone-300">
              <Clock3 className="h-3.5 w-3.5 text-gold" aria-hidden />
              Next free spin in <span className="text-gold">{cooldownLabel}</span>
            </p>
            {lastWinCoupon ? (
              <p className="text-[11px] text-stone-400">
                Yours to use:{" "}
                <span className="font-mono font-bold text-gold">{lastWinCoupon.code}</span> ·{" "}
                {lastWinCoupon.label}
              </p>
            ) : (
              <p className="text-[11px] text-stone-400">Better luck on the next spin!</p>
            )}
          </div>
        ) : (
          <p className="text-sm font-semibold text-stone-300">
            Tap the 🎁 to spin — 5 of 8 slices win!
          </p>
        )}
      </div>

      {/* Prize legend */}
      <ul className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[10px] font-bold uppercase tracking-wide text-stone-400">
        {["15% off", "₹50 off", "Free shipping", "10% off"].map((p) => (
          <li key={p} className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-gold" aria-hidden="true" />
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}
