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
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  mrp?: number;
  image: string;
  category: string;
  qty: number;
};

export type DeliveryLocation = {
  city: string;
  state?: string;
  pincode?: string;
};

export const FREE_SHIPPING_THRESHOLD = 999;
/** Every 3rd order unlocks this loyalty coupon (₹100 flat). */
export const LOYALTY_TARGET = 3;
export const LOYALTY_COUPON = "BLOOM100";

export type OrderRecord = {
  id: string;
  total: number;
  at: number;
  items: number;
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
  stamps: number;
  rewardCoupon: string | null;
  /** Records a completed order, advances loyalty stamps (returns unlocked coupon or null). */
  recordOrder: (order: OrderRecord) => string | null;
  dismissReward: () => void;

  /* ---------- location ---------- */
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  isLocationOpen: boolean;
  setLocationOpen: (open: boolean) => void;

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
      stamps: 0,
      rewardCoupon: null,
      recordOrder: (order) => {
        const { orderHistory, stamps, rewardCoupon } = get();
        const nextHistory = [order, ...orderHistory].slice(0, 8);
        if (stamps + 1 >= LOYALTY_TARGET) {
          const fresh = rewardCoupon ? null : LOYALTY_COUPON;
          set({
            orderHistory: nextHistory,
            stamps: 0,
            rewardCoupon: rewardCoupon ?? LOYALTY_COUPON,
          });
          return fresh;
        }
        set({ orderHistory: nextHistory, stamps: stamps + 1 });
        return null;
      },
      dismissReward: () => set({ rewardCoupon: null }),

      location: null,
      setLocation: (loc) => set({ location: loc, isLocationOpen: false }),
      isLocationOpen: false,
      setLocationOpen: (open) => set({ isLocationOpen: open }),

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
    }),
    {
      name: "bloom-bliss-shop",
      version: 4,
      // v1 wishlist string[] → v2 snapshots; v3 adds spin-wheel fields;
      // v4 adds order history + loyalty stamps + cart upsell prefs.
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
          stamps?: number;
          rewardCoupon?: string | null;
          premiumWrap?: boolean;
          deliverySlot?: ShopState["deliverySlot"];
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
          stamps: typeof s.stamps === "number" ? Math.min(Math.max(s.stamps, 0), LOYALTY_TARGET) : 0,
          rewardCoupon: typeof s.rewardCoupon === "string" ? s.rewardCoupon : null,
          premiumWrap: typeof s.premiumWrap === "boolean" ? s.premiumWrap : false,
          deliverySlot:
            s.deliverySlot === "standard" || s.deliverySlot === "midnight"
              ? s.deliverySlot
              : "same-day",
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
        stamps: state.stamps,
        rewardCoupon: state.rewardCoupon,
        premiumWrap: state.premiumWrap,
        deliverySlot: state.deliverySlot,
      }),
    }
  )
);

/* Derived helpers */
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.qty, 0);

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.qty, 0);
