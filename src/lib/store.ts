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
    }),
    {
      name: "bloom-bliss-shop",
      version: 2,
      // v1 stored wishlist as string[] — v2 stores full snapshots; drop legacy ids.
      migrate: (persisted) => {
        const s = (persisted ?? {}) as {
          cart?: CartItem[];
          location?: DeliveryLocation | null;
          wishlist?: unknown;
          recentlyViewed?: ProductSnapshot[];
          lastOrderId?: string | null;
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
        };
      },
      partialize: (state) => ({
        cart: state.cart,
        location: state.location,
        wishlist: state.wishlist,
        recentlyViewed: state.recentlyViewed,
        lastOrderId: state.lastOrderId,
      }),
    }
  )
);

/* Derived helpers */
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.qty, 0);

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.qty, 0);
