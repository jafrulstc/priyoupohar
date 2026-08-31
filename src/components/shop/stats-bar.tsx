"use client";

import { useEffect, useRef, useState } from "react";
import { animate, motion, useInView } from "framer-motion";
import {
  Heart,
  MapPin,
  Star,
  Truck,
  type LucideIcon,
} from "lucide-react";

const formatEnIN = (v: number) =>
  new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);

type Stat = {
  icon: LucideIcon;
  to: number;
  suffix: string;
  label: string;
  format: (v: number) => string;
  filled?: boolean;
};

const STATS: Stat[] = [
  {
    icon: Heart,
    to: 5000000,
    suffix: "+",
    label: "Smiles delivered",
    format: formatEnIN,
    filled: true,
  },
  {
    icon: MapPin,
    to: 400,
    suffix: "+",
    label: "Cities served",
    format: formatEnIN,
  },
  {
    icon: Truck,
    to: 25000,
    suffix: "+",
    label: "Pincodes covered",
    format: formatEnIN,
  },
  {
    icon: Star,
    to: 4.8,
    suffix: "★",
    label: "Average rating",
    format: (v: number) => v.toFixed(1),
    filled: true,
  },
];

function CountUp({
  to,
  format,
  suffix,
}: {
  to: number;
  format: (v: number) => string;
  suffix: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6,
      ease: "easeOut",
      onUpdate: (v) => setValue(v),
    });
    return () => controls.stop();
  }, [inView, to]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(value)}
      {suffix}
    </span>
  );
}

export default function StatsBar() {
  return (
    <section
      aria-label="Bloom & Bliss in numbers"
      className="bg-gradient-brand py-10 text-white"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 md:grid-cols-4">
        {STATS.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: index * 0.08 }}
            className="flex items-center gap-3 md:gap-4"
          >
            <span
              aria-hidden
              className="animate-float shrink-0 rounded-2xl bg-white/15 p-3 backdrop-blur-md"
              style={{ animationDelay: `${index * 0.75}s` }}
            >
              <stat.icon
                className="h-5 w-5 md:h-6 md:w-6"
                strokeWidth={2.2}
                fill={stat.filled ? "currentColor" : "none"}
              />
            </span>
            <div className="min-w-0">
              <div className="text-2xl font-extrabold leading-tight md:text-4xl">
                <CountUp to={stat.to} format={stat.format} suffix={stat.suffix} />
              </div>
              <div className="text-xs font-medium text-white/85 md:text-sm">
                {stat.label}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
