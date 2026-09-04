"use client";

import { useState, type MouseEvent } from "react";
import Image from "next/image";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import OccasionDialog, {
  type OccasionSelection,
} from "@/components/shop/occasion-dialog";

const SPRING = { type: "spring", stiffness: 300, damping: 24 } as const;
const SPRING_OPTS = { stiffness: 300, damping: 24 };
const MAX_SHIFT = 10;

type Occasion = {
  label: string;
  image: string;
  emoji: string;
  midnight?: boolean;
};

const OCCASIONS: Occasion[] = [
  { label: "Midnight Surprise", image: "/images/occasions/midnight.jpg", emoji: "🌙", midnight: true },
  { label: "Birthday", image: "/images/occasions/birthday.jpg", emoji: "🎂" },
  { label: "Anniversary", image: "/images/occasions/anniversary.jpg", emoji: "💞" },
  { label: "Mother's Day", image: "/images/occasions/mothersday.jpg", emoji: "🌷" },
  { label: "Wedding", image: "/images/occasions/wedding.jpg", emoji: "💍" },
  { label: "Diwali", image: "/images/occasions/diwali.jpg", emoji: "🪔" },
  { label: "New Baby", image: "/images/occasions/baby.jpg", emoji: "🍼" },
  { label: "Green Gifts", image: "/images/occasions/plants.jpg", emoji: "🪴" },
];

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function OccasionTile({
  occasion,
  index,
  onSelect,
}: {
  occasion: Occasion;
  index: number;
  onSelect: (occasion: Occasion) => void;
}) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const springX = useSpring(mx, SPRING_OPTS);
  const springY = useSpring(my, SPRING_OPTS);

  const handleMove = (e: MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx =
      ((e.clientX - (rect.left + rect.width / 2)) / (rect.width / 2)) *
      MAX_SHIFT;
    const ny =
      ((e.clientY - (rect.top + rect.height / 2)) / (rect.height / 2)) *
      MAX_SHIFT;
    mx.set(clamp(nx, -MAX_SHIFT, MAX_SHIFT));
    my.set(clamp(ny, -MAX_SHIFT, MAX_SHIFT));
  };

  const resetMagnet = () => {
    mx.set(0);
    my.set(0);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ ...SPRING, delay: index * 0.06 }}
    >
      {/* Animated gradient border */}
      <div className="shadow-soft rounded-3xl bg-[linear-gradient(135deg,#e11d48,#f59e0b,#fb7185,#e11d48)] bg-[length:300%_300%] bg-[position:0%_0%] p-[2px] transition-all duration-700 hover:bg-[position:100%_50%] hover:shadow-lift">
        <motion.button
          type="button"
          onMouseMove={handleMove}
          onMouseLeave={resetMagnet}
          onClick={() => onSelect(occasion)}
          aria-label={`Shop ${occasion.label} gifts`}
          className="group relative block aspect-[4/5] w-full cursor-pointer overflow-hidden rounded-[calc(1.5rem-2px)] text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-brand md:aspect-square"
        >
          <Image
            src={occasion.image}
            alt={occasion.label}
            fill
            priority={index < 4}
            sizes="(max-width: 768px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
          <div
            aria-hidden
            className="absolute inset-0 bg-gradient-to-t from-charcoal/85 via-charcoal/20 to-transparent"
          />
          {occasion.midnight ? (
            <span
              aria-hidden
              className="animate-pulse-glow absolute top-3 right-3 rounded-full bg-gold px-2.5 py-1 text-[10px] font-bold text-charcoal"
            >
              ⚡ Midnight ready
            </span>
          ) : null}
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4">
            <div className="flex items-center gap-1.5">
              <span aria-hidden className="text-base md:text-xl">
                {occasion.emoji}
              </span>
              <h3 className="drop-shadow text-sm font-extrabold text-white md:text-lg">
                {occasion.label}
              </h3>
            </div>
            {/* Magnetic CTA chip — follows the cursor within the tile */}
            <motion.span
              aria-hidden
              whileTap={{ scale: 0.9 }}
              style={{ x: springX, y: springY }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(occasion);
              }}
              className="shadow-lift mt-2 inline-flex cursor-pointer items-center whitespace-nowrap rounded-full bg-white dark:bg-card px-3 py-1.5 text-[10px] font-extrabold text-charcoal dark:text-foreground md:text-xs"
            >
              Shop now →
            </motion.span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

export default function OccasionGrid() {
  const { toast } = useToast();
  const [selection, setSelection] = useState<OccasionSelection | null>(null);

  const handleSelect = (occasion: Occasion) => {
    setSelection({
      label: occasion.label,
      emoji: occasion.emoji,
      midnight: occasion.midnight,
    });
    toast({
      title: `${occasion.label} collection ${occasion.emoji}`,
      description: "Hand-curated picks, one tap away.",
    });
  };

  return (
    <section id="occasions" className="scroll-mt-24 py-16 md:py-20">
      <div className="mx-auto max-w-7xl px-4 md:px-8">
        <div className="max-w-2xl">
          <p className="text-brand dark:text-rose-400 text-xs font-bold uppercase tracking-[0.2em] md:text-sm">
            🎉 Every celebration covered
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-foreground md:text-4xl">
            Shop by <span className="text-gradient-brand">Occasion</span>
          </h2>
          <p className="mt-3 text-sm text-stone-500 dark:text-stone-400 md:text-base">
            From midnight cake drops to wedding-day gifts — handpicked hampers,
            cakes &amp; gifts for every moment that matters.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3 md:mt-10 md:grid-cols-4 md:gap-5">
          {OCCASIONS.map((occasion, index) => (
            <OccasionTile
              key={occasion.label}
              occasion={occasion}
              index={index}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>

      {/* Curated picks dialog */}
      <OccasionDialog
        selection={selection}
        onClose={() => setSelection(null)}
      />
    </section>
  );
}
