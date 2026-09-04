"use client";

import { useEffect } from "react";
import { useShopStore, type ProductSnapshot } from "@/lib/store";

/**
 * Opens the product quick view when the page is loaded with ?gift=<slug>.
 * Lets shoppers share/bookmark direct links to any gift.
 */
export default function DeepLinkOpener() {
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("gift");
    if (!slug) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/products?slug=${encodeURIComponent(slug)}&limit=1`);
        if (!res.ok) return;
        const data = (await res.json()) as { products?: ProductSnapshot[] };
        const product = data.products?.[0];
        if (!cancelled && product) {
          useShopStore.getState().setQuickViewProduct(product);
        }
      } catch {
        /* deep-link is best-effort */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}
