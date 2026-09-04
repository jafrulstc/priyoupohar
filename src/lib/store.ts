"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

/** Full product snapshot used by wishlist + recently-viewed rails. */
export type ProductSnapshot = {
  id: string;
  name: string;
  slug: string;
  category: string;
  price: number;
  mrp: number;
  image: string;
  rating: number;
  reviews: number;
  tag?: string | null;
  sameDay: boolean;
  description: string;
  pairsWith?: string | null;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  qty: number;
  /** Catalogue slug when the item came from a real product (hero adds etc.). */
  slug?: string;
};

export type DeliveryLocation = {
  city: string;
  state?: string;
  pincode?: string;
};

/** Photo attached to the gift-message card (uploaded to S3-compatible storage). */
export type GiftPhoto = {
  /** Presigned GET URL — works on private buckets, expires after ~7 days. */
  url: string;
  /** Permanent path-style URL — works once the bucket allows public reads. */
  canonical: string;
  /** Object key inside the bucket, e.g. "gift-photos/2025-11/<uuid>.jpg". */
  key: string;
  name: string;
  uploadedAt: number;
};

/** A concrete delivery window chosen from /api/slots for the current pincode. */
export type DeliverySlot = {
  id: string;
  dateISO: string;
  dayLabel: string;
  window: string;
  cutoff: string;
  cutoffAt: string;
  kind: "same-day" | "midnight" | "standard";
  left: number;
};

export const FREE_SHIPPING_THRESHOLD = 999;
/** Loyalty: every 3rd order unlocks a reward; the reward tiers up each cycle. */
export const LOYALTY_TARGET = 3;
export const LOYALTY_COUPON = "PRIYO100";
/** Reward ladder — cycle 1 → PRIYO100, cycle 2 → SHIPFREE, cycle 3 → SPIN15, repeats. */
export const LOYALTY_TIERS = ["PRIYO100", "SHIPFREE", "SPIN15"] as const;
export const loyaltyRewardFor = (completedCycles: number) =>
  LOYALTY_TIERS[(Math.max(completedCycles, 1) - 1) % LOYALTY_TIERS.length];

export type Theme = "light" | "dark";

/** Gift-card design — washi tape strip + wax seal colours (ids, styled in the editor). */
export const WASHI_OPTIONS = ["rose", "gold", "mint", "lilac"] as const;
export const SEAL_OPTIONS = ["rose", "gold", "charcoal"] as const;
export type WashiId = (typeof WASHI_OPTIONS)[number];
export type SealId = (typeof SEAL_OPTIONS)[number];
export type CardDesign = { washi: WashiId; seal: SealId };
export const DEFAULT_CARD_DESIGN: CardDesign = { washi: "rose", seal: "rose" };

export type OrderRecord = {
  id: string;
  total: number;
  at: number;
  items: number;
  /** Human delivery window chosen at checkout, e.g. "Today · 11 PM–1 AM". */
  slot?: string;
};

type ShopState = {
  /* ---------- cart ---------- */
  cart: CartItem[];
  lastAddedAt: number;
  addToCart: (item: Omit<CartItem, "qty">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQty: (id: string, delta: number) => void;
  clearCart: () => void;

  /* ---------- cart drawer ---------- */
  isCartOpen: boolean;
  setCartOpen: (open: boolean) => void;

  /* ---------- search ---------- */
  isSearchOpen: boolean;
  setSearchOpen: (open: boolean) => void;

  /* ---------- quick view ---------- */
  quickViewProduct: ProductSnapshot | null;
  setQuickViewProduct: (
    p: ShopState["quickViewProduct"]
  ) => void;

  /* ---------- recently viewed ---------- */
  recentlyViewed: ProductSnapshot[];
  pushRecentlyViewed: (p: ProductSnapshot) => void;
  clearRecentlyViewed: () => void;

  /* ---------- order tracking ---------- */
  isTrackOpen: boolean;
  setTrackOpen: (open: boolean) => void;
  lastOrderId: string | null;
  setLastOrderId: (id: string) => void;

  /* ---------- order history + loyalty ---------- */
  orderHistory: OrderRecord[];
  ordersCount: number;
  stamps: number;
  rewardCoupon: string | null;
  /** Records a completed order, advances loyalty stamps (returns unlocked coupon or null). */
  recordOrder: (order: OrderRecord) => string | null;
  dismissReward: () => void;

  /* ---------- theme ---------- */
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;

  /* ---------- location ---------- */
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  isLocationOpen: boolean;
  setLocationOpen: (open: boolean) => void;

  /* ---------- delivery slots (availability engine) ---------- */
  chosenSlot: DeliverySlot | null;
  setChosenSlot: (slot: DeliverySlot | null) => void;

  /* ---------- wishlist ---------- */
  wishlist: ProductSnapshot[];
  toggleWishlist: (p: ProductSnapshot) => void;
  removeFromWishlist: (id: string) => void;
  clearWishlist: () => void;
  isWishlistOpen: boolean;
  setWishlistOpen: (open: boolean) => void;

  /* ---------- spin-to-win wheel ---------- */
  spinPrize: { code: string; label: string } | null;
  spinAt: number;
  setSpinResult: (prize: { code: string; label: string } | null, at: number) => void;

  /* ---------- cart upsells (session prefs) ---------- */
  premiumWrap: boolean;
  setPremiumWrap: (v: boolean) => void;
  deliverySlot: "standard" | "same-day" | "midnight";
  setDeliverySlot: (slot: ShopState["deliverySlot"]) => void;
  /** Free handwritten message card — persisted so it survives drawer closes. */
  giftMessage: string;
  setGiftMessage: (msg: string) => void;
  /** Card designer — washi tape + wax seal colours for the message card. */
  cardDesign: CardDesign;
  setCardDesign: (d: Partial<CardDesign>) => void;
  /** Photo personalization — uploaded image shown on the message card. */
  giftPhoto: GiftPhoto | null;
  setGiftPhoto: (p: GiftPhoto | null) => void;
};

export const useShopStore = create<ShopState>()(
  persist(
    (set, get) => ({
      cart: [],
      lastAddedAt: 0,
      addToCart: (item, qty = 1) =>
        set((state) => {
          const existing = state.cart.find((c) => c.id === item.id);
          const cart = existing
            ? state.cart.map((c) =>
                c.id === item.id ? { ...c, qty: c.qty + qty } : c
              )
            : [...state.cart, { ...item, qty }];
          return { cart, lastAddedAt: Date.now() };
        }),
      removeFromCart: (id) =>
        set((state) => ({ cart: state.cart.filter((c) => c.id !== id) })),
      updateQty: (id, delta) =>
        set((state) => ({
          cart: state.cart
            .map((c) => (c.id === id ? { ...c, qty: Math.max(0, c.qty + delta) } : c))
            .filter((c) => c.qty > 0),
        })),
      clearCart: () => set({ cart: [] }),

      isCartOpen: false,
      setCartOpen: (open) => set({ isCartOpen: open }),

      isSearchOpen: false,
      setSearchOpen: (open) => set({ isSearchOpen: open }),

      quickViewProduct: null,
      setQuickViewProduct: (p) => set({ quickViewProduct: p }),

      recentlyViewed: [],
      pushRecentlyViewed: (p) =>
        set((state) => ({
          recentlyViewed: [
            p,
            ...state.recentlyViewed.filter((r) => r.id !== p.id),
          ].slice(0, 8),
        })),
      clearRecentlyViewed: () => set({ recentlyViewed: [] }),

      isTrackOpen: false,
      setTrackOpen: (open) => set({ isTrackOpen: open }),
      lastOrderId: null,
      setLastOrderId: (id) => set({ lastOrderId: id }),

      orderHistory: [],
      ordersCount: 0,
      stamps: 0,
      rewardCoupon: null,
      recordOrder: (order) => {
        const { orderHistory, stamps, rewardCoupon, ordersCount } = get();
        const nextHistory = [order, ...orderHistory].slice(0, 8);
        const nextCount = ordersCount + 1;
        if (stamps + 1 >= LOYALTY_TARGET) {
          const cycle = Math.floor(nextCount / LOYALTY_TARGET);
          const reward = loyaltyRewardFor(cycle);
          const fresh = rewardCoupon ? null : reward;
          set({
            orderHistory: nextHistory,
            ordersCount: nextCount,
            stamps: 0,
            rewardCoupon: rewardCoupon ?? reward,
          });
          return fresh;
        }
        set({ orderHistory: nextHistory, ordersCount: nextCount, stamps: stamps + 1 });
        return null;
      },
      dismissReward: () => set({ rewardCoupon: null }),

      theme: "light",
      toggleTheme: () =>
        set((state) => ({ theme: state.theme === "dark" ? "light" : "dark" })),
      setTheme: (t) => set({ theme: t }),

      location: null,
      setLocation: (loc) =>
        set((state) => ({
          location: loc,
          isLocationOpen: false,
          /* slot availability is zone-specific — drop the choice when the city changes */
          chosenSlot:
            state.chosenSlot &&
            state.location?.pincode &&
            state.location.pincode === loc.pincode
              ? state.chosenSlot
              : null,
        })),
      isLocationOpen: false,
      setLocationOpen: (open) => set({ isLocationOpen: open }),

      chosenSlot: null,
      setChosenSlot: (slot) => set({ chosenSlot: slot }),

      wishlist: [],
      toggleWishlist: (p) =>
        set((state) => ({
          wishlist: state.wishlist.some((w) => w.id === p.id)
            ? state.wishlist.filter((w) => w.id !== p.id)
            : [p, ...state.wishlist],
        })),
      removeFromWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.filter((w) => w.id !== id),
        })),
      clearWishlist: () => set({ wishlist: [] }),

      isWishlistOpen: false,
      setWishlistOpen: (open) => set({ isWishlistOpen: open }),

      spinPrize: null,
      spinAt: 0,
      setSpinResult: (prize, at) => set({ spinPrize: prize, spinAt: at }),

      premiumWrap: false,
      setPremiumWrap: (v) => set({ premiumWrap: v }),
      deliverySlot: "same-day",
      setDeliverySlot: (slot) => set({ deliverySlot: slot }),
      giftMessage: "",
      setGiftMessage: (msg) => set({ giftMessage: msg.slice(0, 280) }),
      cardDesign: DEFAULT_CARD_DESIGN,
      setCardDesign: (d) =>
        set((state) => ({ cardDesign: { ...state.cardDesign, ...d } })),
      giftPhoto: null,
      setGiftPhoto: (p) => set({ giftPhoto: p }),
    }),
    {
      name: "priyo-upohar-shop",
      version: 9,
      // v1 wishlist string[] → v2 snapshots; v3 adds spin-wheel fields;
      // v4 adds order history + loyalty stamps + cart upsell prefs;
      // v5 adds theme + lifetime ordersCount for tiered loyalty rewards;
      // v6 adds the free gift-message card (persisted draft);
      // v7 adds the chosen delivery slot (availability engine);
      // v8 adds the card designer (washi tape + wax seal colours).
      // v9 adds the gift photo (S3-uploaded image on the message card).
      migrate: (persisted) => {
        const s = (persisted ?? {}) as {
          cart?: CartItem[];
          location?: DeliveryLocation | null;
          wishlist?: unknown;
          recentlyViewed?: ProductSnapshot[];
          lastOrderId?: string | null;
          spinPrize?: { code: string; label: string } | null;
          spinAt?: number;
          orderHistory?: OrderRecord[];
          ordersCount?: number;
          stamps?: number;
          rewardCoupon?: string | null;
          premiumWrap?: boolean;
          deliverySlot?: ShopState["deliverySlot"];
          theme?: Theme;
          giftMessage?: string;
          chosenSlot?: DeliverySlot | null;
          cardDesign?: Partial<CardDesign>;
          giftPhoto?: GiftPhoto | null;
        };
        return {
          cart: Array.isArray(s.cart) ? s.cart : [],
          location: s.location ?? null,
          wishlist: Array.isArray(s.wishlist)
            ? s.wishlist.filter(
                (w): w is ProductSnapshot =>
                  typeof w === "object" && w !== null && "id" in w
              )
            : [],
          recentlyViewed: Array.isArray(s.recentlyViewed)
            ? s.recentlyViewed
            : [],
          lastOrderId: typeof s.lastOrderId === "string" ? s.lastOrderId : null,
          spinPrize:
            s.spinPrize && typeof s.spinPrize === "object" && "code" in s.spinPrize
              ? s.spinPrize
              : null,
          spinAt: typeof s.spinAt === "number" ? s.spinAt : 0,
          orderHistory: Array.isArray(s.orderHistory) ? s.orderHistory.slice(0, 8) : [],
          ordersCount:
            typeof s.ordersCount === "number"
              ? s.ordersCount
              : Array.isArray(s.orderHistory)
                ? s.orderHistory.length
                : 0,
          stamps: typeof s.stamps === "number" ? Math.min(Math.max(s.stamps, 0), LOYALTY_TARGET) : 0,
          rewardCoupon: typeof s.rewardCoupon === "string" ? s.rewardCoupon : null,
          premiumWrap: typeof s.premiumWrap === "boolean" ? s.premiumWrap : false,
          deliverySlot:
            s.deliverySlot === "standard" || s.deliverySlot === "midnight"
              ? s.deliverySlot
              : "same-day",
          theme: s.theme === "dark" ? "dark" : "light",
          giftMessage: typeof s.giftMessage === "string" ? s.giftMessage.slice(0, 280) : "",
          chosenSlot:
            s.chosenSlot &&
            typeof s.chosenSlot === "object" &&
            typeof (s.chosenSlot as DeliverySlot).id === "string" &&
            typeof (s.chosenSlot as DeliverySlot).dateISO === "string"
              ? (s.chosenSlot as DeliverySlot)
              : null,
          cardDesign: {
            washi: WASHI_OPTIONS.includes(s.cardDesign?.washi as WashiId)
              ? (s.cardDesign!.washi as WashiId)
              : DEFAULT_CARD_DESIGN.washi,
            seal: SEAL_OPTIONS.includes(s.cardDesign?.seal as SealId)
              ? (s.cardDesign!.seal as SealId)
              : DEFAULT_CARD_DESIGN.seal,
          },
          giftPhoto:
            s.giftPhoto &&
            typeof s.giftPhoto === "object" &&
            typeof s.giftPhoto.url === "string" &&
            typeof s.giftPhoto.key === "string"
              ? s.giftPhoto
              : null,
        };
      },
      partialize: (state) => ({
        cart: state.cart,
        location: state.location,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        lastOrderId: state.lastOrderId,
        spinPrize: state.spinPrize,
        spinAt: state.spinAt,
        orderHistory: state.orderHistory,
        ordersCount: state.ordersCount,
        stamps: state.stamps,
        rewardCoupon: state.rewardCoupon,
        premiumWrap: state.premiumWrap,
        deliverySlot: state.deliverySlot,
        theme: state.theme,
        giftMessage: state.giftMessage,
        chosenSlot: state.chosenSlot,
        cardDesign: state.cardDesign,
        giftPhoto: state.giftPhoto,
      }),
    }
  )
);

/* Derived helpers */
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.qty, 0);

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.qty, 0);
