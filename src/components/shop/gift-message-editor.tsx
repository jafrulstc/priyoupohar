"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  PenLine,
  Flower2,
  Eraser,
  Sparkles,
  Cake,
  HeartHandshake,
  PartyPopper,
  Sun,
  Heart,
  type LucideIcon,
} from "lucide-react";
import { useShopStore } from "@/lib/store";
import { cn } from "@/lib/utils";

type Template = { id: string; label: string; icon: LucideIcon; text: string };

const TEMPLATES: Template[] = [
  {
    id: "birthday",
    label: "Birthday",
    icon: Cake,
    text: "Happy Birthday! 🎂 May your year bloom with joy, laughter and sweet surprises.",
  },
  {
    id: "anniversary",
    label: "Anniversary",
    icon: HeartHandshake,
    text: "Happy Anniversary! 💕 Here's to the love that keeps blooming, year after year.",
  },
  {
    id: "congrats",
    label: "Congrats",
    icon: PartyPopper,
    text: "Congratulations! 🎉 You did it — so proud of you. Time to celebrate!",
  },
  {
    id: "getwell",
    label: "Get well",
    icon: Sun,
    text: "Sending sunny thoughts and a speedy recovery. 🌻 Rest up — brighter days are on the way!",
  },
  {
    id: "romantic",
    label: "Just because",
    icon: Heart,
    text: "No occasion, just love. ❤️ You make every ordinary day feel like a celebration.",
  },
];

const MAX_LEN = 280;

/**
 * Free handwritten message card — collapsible editor with occasion templates,
 * a 280-char counter and a live paper preview. Stored in the shop store and
 * sent to /api/checkout as `message`.
 */
export default function GiftMessageEditor() {
  const giftMessage = useShopStore((s) => s.giftMessage);
  const setGiftMessage = useShopStore((s) => s.setGiftMessage);
  const [open, setOpen] = useState(false);
  const [activeTpl, setActiveTpl] = useState<string | null>(null);

  const remaining = MAX_LEN - giftMessage.length;
  const counterTone =
    remaining <= 0
      ? "text-brand"
      : remaining <= 40
        ? "text-amber-600 dark:text-amber-300"
        : "text-stone-400";

  const previewText = useMemo(() => giftMessage.trim(), [giftMessage]);

  return (
    <motion.div
      layout
      className={cn(
        "overflow-hidden rounded-2xl border-2 transition-colors",
        giftMessage
          ? "border-mint/60 bg-mint/5 dark:bg-mint/10"
          : "border-rose-100 bg-card dark:border-stone-800"
      )}
    >
      {/* Header — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 px-3.5 py-3 text-left"
      >
        <motion.span
          animate={giftMessage ? { rotate: [0, -10, 10, 0] } : {}}
          transition={{ duration: 0.5 }}
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
            giftMessage
              ? "bg-mint text-white"
              : "bg-brand-soft text-brand dark:bg-rose-950/50 dark:text-rose-300"
          )}
          aria-hidden
        >
          <PenLine className="h-4.5 w-4.5" />
        </motion.span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-1.5 text-xs font-extrabold text-foreground">
            Message card
            <span className="rounded-full bg-mint/15 px-1.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide text-mint">
              Free
            </span>
          </span>
          <span className="mt-0.5 block truncate text-[10px] font-semibold text-stone-400">
            {giftMessage
              ? giftMessage
              : "Handwritten by our florists & tucked into your gift"}
          </span>
        </span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.25 }}
          className="text-stone-400"
          aria-hidden
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>

      {/* Editor body */}
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="editor"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
            className="overflow-hidden"
          >
            <div className="space-y-3 px-3.5 pb-3.5">
              {/* Occasion templates */}
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                  <Sparkles className="h-3 w-3 text-gold" aria-hidden />
                  Start with a thought
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {TEMPLATES.map((tpl) => {
                    const Icon = tpl.icon;
                    const active = activeTpl === tpl.id;
                    return (
                      <motion.button
                        key={tpl.id}
                        whileTap={{ scale: 0.93 }}
                        onClick={() => {
                          setGiftMessage(tpl.text);
                          setActiveTpl(tpl.id);
                        }}
                        aria-pressed={active}
                        className={cn(
                          "flex items-center gap-1 rounded-full px-2.5 py-1.5 text-[11px] font-bold transition",
                          active
                            ? "bg-brand text-white shadow-soft"
                            : "bg-cream text-stone-600 hover:bg-rose-50 hover:text-brand dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700 dark:hover:text-rose-300"
                        )}
                      >
                        <Icon className="h-3 w-3" aria-hidden />
                        {tpl.label}
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Textarea */}
              <div>
                <textarea
                  value={giftMessage}
                  onChange={(e) => {
                    setGiftMessage(e.target.value);
                    setActiveTpl(null);
                  }}
                  rows={3}
                  maxLength={MAX_LEN}
                  placeholder="Write from the heart… e.g. “For the one who makes every day brighter.”"
                  aria-label="Gift message"
                  className="w-full resize-none rounded-xl border border-stone-200 bg-cream px-3 py-2.5 text-xs font-semibold leading-relaxed text-foreground placeholder:font-normal placeholder:text-stone-300 focus:border-rose-300 focus:outline-none focus:ring-2 focus:ring-rose-200 dark:border-stone-700 dark:bg-stone-900 dark:placeholder:text-stone-600 dark:focus:ring-rose-900"
                />
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-stone-400">
                    Written in your words, in lovely cursive ✍️
                  </span>
                  <span className="flex items-center gap-2">
                    {giftMessage && (
                      <button
                        onClick={() => {
                          setGiftMessage("");
                          setActiveTpl(null);
                        }}
                        className="flex items-center gap-1 text-[10px] font-bold text-stone-400 transition hover:text-brand"
                        aria-label="Clear message"
                      >
                        <Eraser className="h-3 w-3" aria-hidden />
                        Clear
                      </button>
                    )}
                    <span
                      className={cn(
                        "font-mono text-[10px] font-bold tabular-nums",
                        counterTone
                      )}
                      aria-live="polite"
                    >
                      {giftMessage.length}/{MAX_LEN}
                    </span>
                  </span>
                </div>
              </div>

              {/* Live paper preview */}
              <AnimatePresence mode="wait" initial={false}>
                {previewText ? (
                  <motion.div
                    key="preview"
                    initial={{ opacity: 0, y: 10, rotate: -2, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, rotate: -1, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.97 }}
                    transition={{ type: "spring", stiffness: 260, damping: 22 }}
                    className="relative overflow-hidden rounded-xl bg-cream p-4 pt-5 shadow-soft dark:bg-stone-900"
                  >
                    {/* dashed inner frame + subtle lined-paper effect */}
                    <span
                      className="pointer-events-none absolute inset-1.5 rounded-lg border border-dashed border-rose-200 dark:border-stone-700"
                      aria-hidden
                    />
                    <span
                      className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-200 via-amber-200 to-rose-200 dark:via-stone-700"
                      aria-hidden
                    />
                    <p
                      className="relative px-2 text-center font-handwriting text-lg font-semibold leading-relaxed text-charcoal dark:text-stone-200"
                    >
                      {previewText}
                    </p>
                    <p className="relative mt-2.5 flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-stone-400">
                      <Flower2 className="h-2.5 w-2.5 text-brand" aria-hidden />
                      Bloom &amp; Bliss
                    </p>
                    {/* wax seal */}
                    <motion.span
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: -8 }}
                      transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
                      className="absolute -right-1.5 -top-1.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-brand to-rose-700 shadow-lift ring-2 ring-white dark:ring-stone-900"
                      aria-hidden
                    >
                      <Flower2 className="h-3.5 w-3.5 text-white" />
                    </motion.span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="preview-empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="rounded-xl border border-dashed border-stone-200 bg-cream/50 px-4 py-5 text-center dark:border-stone-700 dark:bg-stone-900/50"
                  >
                    <p className="text-[11px] font-semibold text-stone-400">
                      Your card preview blooms here 🌷
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
