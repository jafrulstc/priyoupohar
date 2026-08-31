"use client";

import {
  Clock3,
  Flower2,
  Gift,
  MoonStar,
  ShieldCheck,
  Sparkles,
  Truck,
  type LucideIcon,
} from "lucide-react";

type Usp = {
  icon: LucideIcon;
  label: string;
};

const USPS: Usp[] = [
  { icon: Truck, label: "Free shipping over ₹999" },
  { icon: Clock3, label: "Same-day delivery" },
  { icon: MoonStar, label: "Midnight delivery till 11:59 PM" },
  { icon: Flower2, label: "Fresh from local farms" },
  { icon: Gift, label: "Free gift wrap & message card" },
  { icon: ShieldCheck, label: "100% secure payments" },
  { icon: Sparkles, label: "New collections every week" },
];

function UspList({ hidden = false }: { hidden?: boolean }) {
  return (
    <ul className="flex shrink-0 items-center gap-10" aria-hidden={hidden}>
      {USPS.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex shrink-0 items-center gap-2 text-sm font-semibold whitespace-nowrap"
        >
          <Icon size={18} strokeWidth={2.4} className="shrink-0" aria-hidden="true" />
          {label}
        </li>
      ))}
    </ul>
  );
}

/** Seamless scrolling strip of store USPs — pauses on hover. */
export default function UspMarquee() {
  return (
    <section
      aria-label="Why shoppers love Bloom & Bliss"
      className="bg-gradient-brand text-white py-3 overflow-hidden border-y border-white/10"
    >
      {/* Two identical copies + pr matching the gap => seamless -50% loop */}
      <div className="flex w-max animate-marquee gap-10 pr-10 hover:[animation-play-state:paused] motion-reduce:animate-none">
        <UspList />
        <UspList hidden />
      </div>
    </section>
  );
}
