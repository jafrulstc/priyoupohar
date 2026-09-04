"use client";

import {
  Facebook,
  Flower2,
  Instagram,
  Twitter,
  Youtube,
  type LucideIcon,
} from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { useToast } from "@/hooks/use-toast";
import { useShopStore } from "@/lib/store";

const SPRING: Transition = { type: "spring", stiffness: 300, damping: 24 };

type Social = {
  icon: LucideIcon;
  label: string;
  message: string;
};

const SOCIALS: Social[] = [
  { icon: Instagram, label: "Instagram", message: "Opening Instagram… (demo)" },
  { icon: Facebook, label: "Facebook", message: "Opening Facebook… (demo)" },
  { icon: Twitter, label: "Twitter", message: "Opening Twitter… (demo)" },
  { icon: Youtube, label: "YouTube", message: "Opening YouTube… (demo)" },
];

const SHOP_LINKS = ["Flowers", "Cakes", "Personalised", "Plants", "Combos"].map(
  (label) => ({ label, href: "#bestsellers" })
);

const OCCASION_LINKS = [
  "Birthday",
  "Anniversary",
  "Midnight Delivery",
  "Diwali",
  "Wedding",
].map((label) => ({ label, href: "#occasions" }));

const HELP_LINKS = [
  "Track Order",
  "Shipping Policy",
  "Returns",
  "Contact Us",
  "FAQs",
];

const PAYMENT_METHODS = ["UPI", "Visa", "Mastercard", "RuPay", "NetBanking"];

const linkClass =
  "flex w-fit items-center gap-1.5 text-sm text-stone-300 transition-all duration-200 hover:text-white hover:translate-x-1";

/** Site footer: brand, link columns, payments — reveals on scroll. */
export default function Footer() {
  const { toast } = useToast();
  const setTrackOpen = useShopStore((s) => s.setTrackOpen);

  const reveal = (delay: number) => ({
    initial: { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 as const },
    transition: { ...SPRING, delay },
  });

  const helpClick = (label: string) => {
    if (label === "Track Order") {
      setTrackOpen(true);
      return;
    }
    toast({
      title: "We're a demo shop — but real helpful! 💝",
      description: `${label} would open right here in the full store.`,
    });
  };

  return (
    <footer className="mt-auto bg-charcoal text-stone-300">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-12">
        <div className="grid gap-10 md:grid-cols-4">
          {/* Col 1 — brand */}
          <motion.div {...reveal(0)}>
            <div className="flex items-center gap-2.5">
              <span className="bg-brand rounded-xl p-2 text-white">
                <Flower2 size={22} aria-hidden="true" />
              </span>
              <span className="font-extrabold text-white text-lg">
                PriyoUpohar
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-400 max-w-xs">
              Spreading smiles across 400+ cities with fresh flowers, cakes
              &amp; handcrafted gifts since 2015.
            </p>
            <div className="mt-5 flex items-center gap-2.5">
              {SOCIALS.map(({ icon: Icon, label, message }) => (
                <button
                  key={label}
                  type="button"
                  aria-label={`PriyoUpohar on ${label}`}
                  onClick={() => toast({ title: message })}
                  className="rounded-full bg-white/5 hover:bg-brand p-2.5 transition active:scale-90"
                >
                  <Icon size={17} aria-hidden="true" />
                </button>
              ))}
            </div>
          </motion.div>

          {/* Col 2 — shop */}
          <motion.nav aria-label="Shop links" {...reveal(0.08)}>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Shop
            </h3>
            <ul className="mt-4 space-y-2.5">
              {SHOP_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={linkClass}>
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-brand"
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Col 3 — occasions */}
          <motion.nav aria-label="Occasion links" {...reveal(0.16)}>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Occasions
            </h3>
            <ul className="mt-4 space-y-2.5">
              {OCCASION_LINKS.map(({ label, href }) => (
                <li key={label}>
                  <a href={href} className={linkClass}>
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-gold"
                    />
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </motion.nav>

          {/* Col 4 — help */}
          <motion.div {...reveal(0.24)}>
            <h3 className="text-sm font-bold uppercase tracking-[0.18em] text-white">
              Help &amp; Support
            </h3>
            <ul className="mt-4 space-y-2.5">
              {HELP_LINKS.map((label) => (
                <li key={label}>
                  <button
                    type="button"
                    onClick={() => helpClick(label)}
                    className={`${linkClass} text-left`}
                  >
                    <span
                      aria-hidden="true"
                      className="h-1 w-1 rounded-full bg-mint"
                    />
                    {label}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-stone-400">
            © 2025 PriyoUpohar. Made with{" "}
            <span aria-label="love" className="text-brand">
              ♥
            </span>{" "}
            in India.
          </p>
          <div
            className="flex flex-wrap items-center justify-center gap-2"
            aria-label="Accepted payment methods"
          >
            {PAYMENT_METHODS.map((method) => (
              <span
                key={method}
                className="rounded-md bg-white/10 px-2.5 py-1 text-[10px] font-bold tracking-wide text-stone-200"
              >
                {method}
              </span>
            ))}
          </div>
          <p className="text-xs text-gold font-semibold">
            Gift happiness, risk-free
          </p>
        </div>
      </div>
    </footer>
  );
}
