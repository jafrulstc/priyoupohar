"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useScroll, useSpring } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";

export default function BackToTop() {
  const [visible, setVisible] = useState(false);
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 700);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.9 }}
          transition={{ type: "spring", stiffness: 380, damping: 24 }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-20 right-4 z-40 grid h-12 w-12 place-items-center rounded-full bg-charcoal text-cream shadow-lift md:bottom-6 md:right-6"
          aria-label="Back to top"
        >
          {/* progress ring */}
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 48 48" aria-hidden>
            <circle cx="24" cy="24" r="21" fill="none" stroke="rgb(255 255 255 / 0.15)" strokeWidth="3" />
            <motion.circle
              cx="24"
              cy="24"
              r="21"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="3"
              strokeLinecap="round"
              style={{ pathLength: progress }}
            />
          </svg>
          <ArrowUp className="h-5 w-5" aria-hidden />
          <Sparkles className="absolute -right-1 -top-1 h-3.5 w-3.5 text-gold" aria-hidden />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
