"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
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
  Palette,
  ImagePlus,
  Loader2,
  Camera,
  X,
  type LucideIcon,
} from "lucide-react";
import { useShopStore, type WashiId, type SealId, type GiftPhoto } from "@/lib/store";
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
const PHOTO_MAX_MB = 5;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

/* ---------- card designer palettes (exported for the checkout success view) ---------- */
export const WASHI_STYLES: Record<WashiId, { label: string; strip: string; dot: string }> = {
  rose: { label: "Rose", strip: "from-rose-300 via-rose-200 to-rose-300", dot: "bg-rose-300" },
  gold: { label: "Gold", strip: "from-amber-300 via-yellow-200 to-amber-300", dot: "bg-amber-300" },
  mint: { label: "Mint", strip: "from-emerald-300 via-teal-100 to-emerald-300", dot: "bg-emerald-300" },
  lilac: { label: "Lilac", strip: "from-purple-300 via-fuchsia-200 to-purple-300", dot: "bg-purple-300" },
};
export const SEAL_STYLES: Record<SealId, { label: string; cls: string; dot: string }> = {
  rose: { label: "Rose", cls: "from-brand to-rose-700", dot: "bg-rose-500" },
  gold: { label: "Gold", cls: "from-amber-400 to-amber-600", dot: "bg-amber-500" },
  charcoal: { label: "Charcoal", cls: "from-stone-500 to-charcoal", dot: "bg-stone-600" },
};

/**
 * Free handwritten message card — collapsible editor with occasion templates,
 * a 280-char counter and a live paper preview. Stored in the shop store and
 * sent to /api/checkout as `message`.
 */
export default function GiftMessageEditor() {
  const giftMessage = useShopStore((s) => s.giftMessage);
  const setGiftMessage = useShopStore((s) => s.setGiftMessage);
  const cardDesign = useShopStore((s) => s.cardDesign);
  const setCardDesign = useShopStore((s) => s.setCardDesign);
  const [open, setOpen] = useState(false);
  const [activeTpl, setActiveTpl] = useState<string | null>(null);

  /* ---------- photo personalization ---------- */
  const giftPhoto = useShopStore((s) => s.giftPhoto);
  const setGiftPhoto = useShopStore((s) => s.setGiftPhoto);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const pickPhoto = async (file: File) => {
    setUploadError(null);
    if (!PHOTO_TYPES.includes(file.type)) {
      setUploadError("JPG, PNG or WebP only, please.");
      return;
    }
    if (file.size > PHOTO_MAX_MB * 1024 * 1024) {
      setUploadError(`That's over ${PHOTO_MAX_MB} MB — try a smaller photo.`);
      return;
    }
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Upload failed");
      const photo: GiftPhoto = {
        url: data.url,
        canonical: data.canonical,
        key: data.key,
        name: file.name,
        uploadedAt: Date.now(),
      };
      setGiftPhoto(photo);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed — try again.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const washi = WASHI_STYLES[cardDesign.washi];
  const seal = SEAL_STYLES[cardDesign.seal];

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

              {/* Photo personalization — uploaded to S3-compatible storage */}
              <div>
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                  <Camera className="h-3 w-3 text-gold" aria-hidden />
                  Add a photo
                  <span className="ml-auto text-[9px] font-bold normal-case tracking-normal text-stone-400/80">
                    jpg · png · webp · up to {PHOTO_MAX_MB} MB
                  </span>
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  aria-label="Attach a photo to your gift"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void pickPhoto(f);
                  }}
                />
                <AnimatePresence mode="wait" initial={false}>
                  {giftPhoto ? (
                    <motion.div
                      key="photo-row"
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="flex items-center gap-2.5 rounded-xl border border-mint/50 bg-mint/5 p-2 dark:bg-mint/10"
                    >
                      <span className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg ring-1 ring-stone-200 dark:ring-stone-700">
                        <Image
                          src={giftPhoto.url}
                          alt="Photo attached to your gift"
                          fill
                          unoptimized
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-bold text-foreground">
                          {giftPhoto.name}
                        </span>
                        <span className="block text-[10px] font-semibold text-mint">
                          Printed alongside your message 🌷
                        </span>
                      </span>
                      <button
                        onClick={() => setGiftPhoto(null)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-rose-50 hover:text-brand dark:hover:bg-stone-800"
                        aria-label="Remove photo"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="photo-btn"
                      type="button"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={uploading}
                      onClick={() => fileInputRef.current?.click()}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-stone-300 bg-cream/50 px-3 py-3 text-[11px] font-bold text-stone-500 transition hover:border-brand/50 hover:text-brand disabled:opacity-60 dark:border-stone-700 dark:bg-stone-900/50 dark:text-stone-400 dark:hover:border-rose-500/50 dark:hover:text-rose-300"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin text-brand" aria-hidden />
                          Uploading your photo…
                        </>
                      ) : (
                        <>
                          <ImagePlus className="h-4 w-4 text-brand" aria-hidden />
                          Attach a photo to the card
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
                {uploadError && (
                  <p className="mt-1 text-[10px] font-bold text-brand" role="alert">
                    {uploadError}
                  </p>
                )}
              </div>

              {/* Card designer — washi + wax seal */}
              <div className="rounded-xl border border-stone-200/70 bg-cream/60 p-2.5 dark:border-stone-700 dark:bg-stone-900/60">
                <p className="mb-1.5 flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wide text-stone-400">
                  <Palette className="h-3 w-3 text-brand" aria-hidden />
                  Design your card
                  <span className="ml-auto text-[9px] font-bold normal-case tracking-normal text-stone-400/80">
                    free · changes live
                  </span>
                </p>
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                      Washi
                    </span>
                    <div className="flex gap-1.5" role="radiogroup" aria-label="Washi tape colour">
                      {(Object.keys(WASHI_STYLES) as WashiId[]).map((id) => {
                        const active = cardDesign.washi === id;
                        return (
                          <motion.button
                            key={id}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setCardDesign({ washi: id })}
                            role="radio"
                            aria-checked={active}
                            aria-label={`${WASHI_STYLES[id].label} washi tape`}
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-full transition",
                              active
                                ? "ring-2 ring-brand ring-offset-2 ring-offset-cream dark:ring-rose-400 dark:ring-offset-stone-900"
                                : "ring-1 ring-stone-200 dark:ring-stone-700"
                            )}
                          >
                            <span className={cn("h-4 w-4 rounded-full", WASHI_STYLES[id].dot)} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-16 shrink-0 text-[10px] font-bold text-stone-500 dark:text-stone-400">
                      Wax seal
                    </span>
                    <div className="flex gap-1.5" role="radiogroup" aria-label="Wax seal colour">
                      {(Object.keys(SEAL_STYLES) as SealId[]).map((id) => {
                        const active = cardDesign.seal === id;
                        return (
                          <motion.button
                            key={id}
                            whileTap={{ scale: 0.85 }}
                            onClick={() => setCardDesign({ seal: id })}
                            role="radio"
                            aria-checked={active}
                            aria-label={`${SEAL_STYLES[id].label} wax seal`}
                            className={cn(
                              "grid h-7 w-7 place-items-center rounded-full transition",
                              active
                                ? "ring-2 ring-brand ring-offset-2 ring-offset-cream dark:ring-rose-400 dark:ring-offset-stone-900"
                                : "ring-1 ring-stone-200 dark:ring-stone-700"
                            )}
                          >
                            <span className={cn("h-4 w-4 rounded-full", SEAL_STYLES[id].dot)} />
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
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
                    {/* washi tape strip — swaps with the chosen colour */}
                    <motion.span
                      key={`washi-${cardDesign.washi}`}
                      initial={{ scaleX: 0.6, opacity: 0.4 }}
                      animate={{ scaleX: 1, opacity: 1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className={cn(
                        "pointer-events-none absolute inset-x-0 top-0 h-1.5 origin-left bg-gradient-to-r",
                        washi.strip
                      )}
                      aria-hidden
                    />
                    {/* polaroid photo — springs in when a photo is attached */}
                    <AnimatePresence>
                      {giftPhoto && (
                        <motion.span
                          key={`photo-${giftPhoto.key}`}
                          initial={{ opacity: 0, scale: 0.5, rotate: -14, y: -8 }}
                          animate={{ opacity: 1, scale: 1, rotate: 6, y: 0 }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ type: "spring", stiffness: 300, damping: 18 }}
                          className="absolute -left-0.5 -top-1 block rounded-md bg-white p-[3px] pb-1 shadow-lift ring-1 ring-stone-200 dark:bg-stone-100 dark:ring-stone-300"
                          aria-hidden
                        >
                          <Image
                            src={giftPhoto.url}
                            alt=""
                            width={52}
                            height={52}
                            unoptimized
                            className="h-[52px] w-[52px] rounded-sm object-cover"
                          />
                        </motion.span>
                      )}
                    </AnimatePresence>
                    <p
                      className="relative px-2 text-center font-handwriting text-lg font-semibold leading-relaxed text-charcoal dark:text-stone-200"
                    >
                      {previewText}
                    </p>
                    <p className="relative mt-2.5 flex items-center justify-center gap-1 text-[9px] font-extrabold uppercase tracking-[0.18em] text-stone-400">
                      <Flower2 className="h-2.5 w-2.5 text-brand" aria-hidden />
                      Bloom &amp; Bliss
                    </p>
                    {/* wax seal — chosen colour */}
                    <motion.span
                      key={`seal-${cardDesign.seal}`}
                      initial={{ scale: 0, rotate: -30 }}
                      animate={{ scale: 1, rotate: -8 }}
                      transition={{ type: "spring", stiffness: 320, damping: 16, delay: 0.15 }}
                      className={cn(
                        "absolute -right-1.5 -top-1.5 grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br shadow-lift ring-2 ring-white dark:ring-stone-900",
                        seal.cls
                      )}
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
