"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: string[];
  alt: string;
  open: boolean;
  onClose: () => void;
  initialIndex?: number;
}

export default function ImageLightbox({
  images,
  alt,
  open,
  onClose,
  initialIndex = 0,
}: ImageLightboxProps) {
  const [idx, setIdx] = useState(initialIndex);
  const [zoomed, setZoomed] = useState(false);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ startX: 0, startY: 0, panStartX: 0, panStartY: 0, dragging: false });

  const goNext = useCallback(() => {
    setIdx((i) => (i + 1) % images.length);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  const goPrev = useCallback(() => {
    setIdx((i) => (i - 1 + images.length) % images.length);
    setZoomed(false);
    setPan({ x: 0, y: 0 });
  }, [images.length]);

  /* Keyboard nav */
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose, goNext, goPrev]);

  /* Lock body scroll */
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const toggleZoom = useCallback(() => {
    setZoomed((z) => !z);
    if (zoomed) setPan({ x: 0, y: 0 });
  }, [zoomed]);

  /* Drag-to-pan in zoomed mode */
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!zoomed) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        panStartX: pan.x,
        panStartY: pan.y,
        dragging: true,
      };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    [zoomed, pan]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current.dragging) return;
      const dx = e.clientX - dragRef.current.startX;
      const dy = e.clientY - dragRef.current.startY;
      setPan({
        x: dragRef.current.panStartX + dx,
        y: dragRef.current.panStartY + dy,
      });
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    dragRef.current.dragging = false;
  }, []);

  /* Swipe detection for mobile */
  const touchStart = useRef(0);
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStart.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (zoomed) return;
      const diff = e.changedTouches[0].clientX - touchStart.current;
      if (Math.abs(diff) > 50) {
        if (diff < 0) goNext();
        else goPrev();
      }
    },
    [zoomed, goNext, goPrev]
  );

  /* Mouse wheel zoom */
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (e.deltaY < 0 && !zoomed) {
        setZoomed(true);
      } else if (e.deltaY > 0 && zoomed) {
        setZoomed(false);
        setPan({ x: 0, y: 0 });
      }
    },
    [zoomed]
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[200] flex flex-col bg-charcoal/95 backdrop-blur-xl"
          role="dialog"
          aria-modal
          aria-label="Image gallery"
        >
          {/* Top bar */}
          <div className="flex items-center justify-between px-4 py-3 sm:px-6">
            <span className="text-xs font-bold text-white/60 tabular-nums">
              {idx + 1} / {images.length}
            </span>
            <div className="flex items-center gap-2">
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={toggleZoom}
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-full transition-colors",
                  zoomed
                    ? "bg-white text-charcoal"
                    : "bg-white/10 text-white hover:bg-white/20"
                )}
                aria-label={zoomed ? "Zoom out" : "Zoom in"}
              >
                {zoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={onClose}
                className="grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
                aria-label="Close gallery"
              >
                <X className="h-5 w-5" />
              </motion.button>
            </div>
          </div>

          {/* Main image area */}
          <div
            className="relative flex flex-1 items-center justify-center overflow-hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onWheel={handleWheel}
          >
            {/* Previous button */}
            {images.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goPrev}
                className="absolute left-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:left-5 sm:h-12 sm:w-12"
                aria-label="Previous image"
              >
                <ChevronLeft className="h-6 w-6" />
              </motion.button>
            )}

            {/* Image with zoom/pan */}
            <AnimatePresence mode="wait">
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={cn(
                  "relative flex items-center justify-center",
                  zoomed ? "h-full w-full cursor-grab active:cursor-grabbing" : "h-full w-full p-4 sm:p-8"
                )}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
              >
                <motion.div
                  animate={{
                    scale: zoomed ? 2.5 : 1,
                    x: pan.x,
                    y: pan.y,
                  }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="relative h-full w-full"
                  style={
                    zoomed
                      ? { maxHeight: "none", maxWidth: "none" }
                      : { maxHeight: "100%", maxWidth: "100%" }
                  }
                >
                  <div
                    className={cn(
                      "relative mx-auto h-full w-full overflow-hidden rounded-2xl sm:rounded-3xl",
                      !zoomed && "max-h-full max-w-[600px] sm:max-w-[800px]"
                    )}
                  >
                    <Image
                      src={images[idx]}
                      alt={`${alt} — image ${idx + 1}`}
                      fill
                      sizes="100vw"
                      className="object-contain"
                      draggable={false}
                    />
                  </div>
                </motion.div>
              </motion.div>
            </AnimatePresence>

            {/* Next button */}
            {images.length > 1 && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={goNext}
                className="absolute right-3 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/25 sm:right-5 sm:h-12 sm:w-12"
                aria-label="Next image"
              >
                <ChevronRight className="h-6 w-6" />
              </motion.button>
            )}
          </div>

          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-4 sm:gap-3">
              {images.map((img, i) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setIdx(i);
                    setZoomed(false);
                    setPan({ x: 0, y: 0 });
                  }}
                  className={cn(
                    "relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-16 sm:w-16",
                    i === idx
                      ? "border-brand shadow-[0_0_12px_rgba(225,29,72,0.4)]"
                      : "border-white/10 opacity-50 hover:opacity-90"
                  )}
                  aria-label={`View image ${i + 1}`}
                  aria-current={i === idx ? "true" : undefined}
                >
                  <Image
                    src={img}
                    alt={`${alt} thumbnail ${i + 1}`}
                    fill
                    sizes="64px"
                    className="object-cover"
                  />
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
