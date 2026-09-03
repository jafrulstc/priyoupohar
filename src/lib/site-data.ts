"use client";

/**
 * Client hooks for Phase-2 DB-driven storefront data (settings, offers,
 * spin config, reviews, order timeline). Each hook fetches through the
 * Caddy gateway (XTransformPort=8000) via react-query and falls back to
 * sensible defaults so the storefront keeps working if the API is briefly
 * unavailable.
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { pyFetch } from "@/lib/py-api";
import type {
  Offer,
  OrderTimeline,
  ProductReview,
  ReviewSummary,
  SiteSettings,
  SpinConfig,
} from "@/lib/py-api";

export const DEFAULT_SETTINGS: SiteSettings = {
  free_delivery_threshold: 999,
  delivery_fee: 99,
  cod_enabled: true,
  support_phone: "+91 98765 43210",
  support_email: "care@bloombliss.test",
  store_name: "Bloom & Bliss",
  announcement_enabled: true,
};

const FALLBACK_SPIN: SpinConfig = {
  cooldown_hours: 24,
  segments: [
    { id: 1, label: "15% OFF", kind: "percent", code: "SPIN15", value: 15, weight: 2, bg: "#E11D48", fg: "#FFFFFF", position: 0, is_active: true, updated_at: "" },
    { id: 2, label: "₹50 OFF", kind: "flat", code: "JOY50", value: 50, weight: 3, bg: "#F59E0B", fg: "#292524", position: 1, is_active: true, updated_at: "" },
    { id: 3, label: "TRY AGAIN", kind: "none", code: null, value: null, weight: 6, bg: "#9F1239", fg: "#FECDD3", position: 2, is_active: true, updated_at: "" },
    { id: 4, label: "FREE SHIP", kind: "freeship", code: "SHIPFREE", value: null, weight: 2, bg: "#FBBF24", fg: "#292524", position: 3, is_active: true, updated_at: "" },
    { id: 5, label: "10% OFF", kind: "percent", code: "BLISS10", value: 10, weight: 3, bg: "#E11D48", fg: "#FFFFFF", position: 4, is_active: true, updated_at: "" },
    { id: 6, label: "BETTER LUCK", kind: "none", code: null, value: null, weight: 5, bg: "#B45309", fg: "#FDE68A", position: 5, is_active: true, updated_at: "" },
    { id: 7, label: "₹50 OFF", kind: "flat", code: "JOY50", value: 50, weight: 3, bg: "#F59E0B", fg: "#292524", position: 6, is_active: true, updated_at: "" },
    { id: 8, label: "SO CLOSE", kind: "none", code: null, value: null, weight: 4, bg: "#9F1239", fg: "#FECDD3", position: 7, is_active: true, updated_at: "" },
  ],
};

const STALE_MS = 60_000;

/**
 * NOTE: these hooks need a QueryClientProvider. The storefront root already
 * mounts one (src/app/page.tsx); if it doesn't, add `new QueryClient(...)`
 * there exactly like the admin overlay does.
 */
export function useInvalidateSiteData() {
  const queryClient = useQueryClient();
  return (key?: string) => {
    if (key) queryClient.invalidateQueries({ queryKey: [key] });
    else queryClient.invalidateQueries();
  };
}

/** Site settings — threshold/fee consumed by cart + checkout. */
export function useSiteSettings() {
  const query = useQuery<SiteSettings>({
    queryKey: ["store", "settings"],
    queryFn: () => pyFetch<SiteSettings>("/api/store/settings"),
    staleTime: STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { data: query.data ?? DEFAULT_SETTINGS, loading: query.isPending };
}

/** Active offers with validity (announcement bar). */
export function useActiveOffers() {
  const query = useQuery<Offer[]>({
    queryKey: ["store", "offers"],
    queryFn: () => pyFetch<Offer[]>("/api/store/offers"),
    staleTime: STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return { data: query.data ?? [], loading: query.isPending };
}

/** Spin-wheel segments from DB (weights honoured client-side too). */
export function useSpinConfig() {
  const query = useQuery<SpinConfig>({
    queryKey: ["store", "spin"],
    queryFn: () => pyFetch<SpinConfig>("/api/store/spin"),
    staleTime: STALE_MS,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  const data = query.data ?? FALLBACK_SPIN;
  const segments = data.segments.length ? data.segments : FALLBACK_SPIN.segments;
  return { data: { ...data, segments }, loading: query.isPending };
}

/** Approved reviews + summary for one product slug/id. */
export function useProductReviews(productId: string | number | null) {
  const slug = productId == null ? null : String(productId);
  const query = useQuery<{ items: ProductReview[]; summary: ReviewSummary }>({
    queryKey: ["store", "reviews", slug],
    queryFn: () =>
      pyFetch<{ items: ProductReview[]; summary: ReviewSummary }>(
        `/api/store/products/${encodeURIComponent(String(slug))}/reviews`
      ),
    enabled: slug != null && slug !== "",
    staleTime: 30_000,
    retry: 1,
    refetchOnWindowFocus: false,
  });
  return {
    reviews: query.data?.items ?? [],
    summary: query.data?.summary ?? null,
    loading: query.isPending,
    reload: () => query.refetch(),
  };
}

/** Order tracking timeline (status history). */
export function useOrderTimeline(orderNumber: string | null) {
  const query = useQuery<OrderTimeline>({
    queryKey: ["store", "timeline", orderNumber],
    queryFn: () =>
      pyFetch<OrderTimeline>(
        `/api/store/orders/${encodeURIComponent(String(orderNumber))}/timeline`
      ),
    enabled: !!orderNumber,
    staleTime: 15_000,
    retry: 0,
    refetchOnWindowFocus: false,
  });
  return {
    timeline: query.data ?? null,
    loading: query.isFetching && query.isPending,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
