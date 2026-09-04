"use client";

import { useEffect, useRef, useState } from "react";
import { useShopStore, cartCount } from "@/lib/store";

type Snapshot = {
  ready: boolean;
  cart: Map<string, { qty: number; name: string }>;
  wishlist: Set<string>;
};

const snapshot = (): Snapshot => {
  const { cart, wishlist } = useShopStore.getState();
  return {
    ready: true,
    cart: new Map(cart.map((c) => [c.id, { qty: c.qty, name: c.name }])),
    wishlist: new Set(wishlist.map((w) => w.id)),
  };
};

/**
 * Screen-reader live region — announces cart & wishlist changes
 * ("Eternal Red Roses added to gift bag. Gift bag now has 2 items.")
 * Visually hidden; the region remounts on each message so identical
 * consecutive messages are re-announced reliably.
 */
export default function LiveAnnouncer() {
  const [message, setMessage] = useState("");
  const [seq, setSeq] = useState(0);
  const prev = useRef<Snapshot>({ ready: false, cart: new Map(), wishlist: new Set() });

  useEffect(() => {
    /* prime with current state — no announcement on hydration */
    prev.current = { ...snapshot(), ready: false };

    /* zustand is an external system: diff inside the subscription callback */
    const unsub = useShopStore.subscribe((state) => {
      const p = prev.current;
      const { cart, wishlist } = state;

      /* ignore any pre-hydration rehydration quirks */
      if (!p.ready) {
        prev.current = snapshot();
        return;
      }

      let next = "";

      /* ---- cart diff ---- */
      const prevCount = Array.from(p.cart.values()).reduce((s, c) => s + c.qty, 0);
      const nowCount = cartCount(cart);
      const added = cart.find((c) => c.qty > (p.cart.get(c.id)?.qty ?? 0));
      const removed = Array.from(p.cart.entries()).find(
        ([id, c]) => c.qty > (cart.find((x) => x.id === id)?.qty ?? 0)
      );

      if (added) {
        next = `${added.name} added to gift bag. Gift bag now has ${nowCount} item${
          nowCount === 1 ? "" : "s"
        }.`;
      } else if (nowCount < prevCount && removed) {
        next = `Item removed from gift bag. Gift bag now has ${nowCount} item${
          nowCount === 1 ? "" : "s"
        }.`;
      }

      /* ---- wishlist diff (only if cart stayed quiet) ---- */
      if (!next) {
        const addedWish = wishlist.find((w) => !p.wishlist.has(w.id));
        if (addedWish) {
          next = `${addedWish.name} saved to wishlist.`;
        } else if (wishlist.length < p.wishlist.size) {
          next = "Removed from wishlist.";
        }
      }

      prev.current = snapshot();

      if (next) {
        setMessage(next);
        setSeq((n) => n + 1);
      }
    });

    return unsub;
  }, []);

  return (
    <div
      key={seq}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}
