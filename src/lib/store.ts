"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  quickViewProduct: {
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
  } | null;
  setQuickViewProduct: (
    p: ShopState["quickViewProduct"]
  ) => void;

  /* ---------- location ---------- */
  location: DeliveryLocation | null;
  setLocation: (loc: DeliveryLocation) => void;
  isLocationOpen: boolean;
  setLocationOpen: (open: boolean) => void;

  /* ---------- wishlist ---------- */
  wishlist: string[];
  toggleWishlist: (id: string) => void;
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

      location: null,
      setLocation: (loc) => set({ location: loc, isLocationOpen: false }),
      isLocationOpen: false,
      setLocationOpen: (open) => set({ isLocationOpen: open }),

      wishlist: [],
      toggleWishlist: (id) =>
        set((state) => ({
          wishlist: state.wishlist.includes(id)
            ? state.wishlist.filter((w) => w !== id)
            : [...state.wishlist, id],
        })),
    }),
    {
      name: "bloom-bliss-shop",
      partialize: (state) => ({
        cart: state.cart,
        location: state.location,
        wishlist: state.wishlist,
      }),
    }
  )
);

/* Derived helpers */
export const cartCount = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.qty, 0);

export const cartTotal = (cart: CartItem[]) =>
  cart.reduce((sum, item) => sum + item.price * item.qty, 0);
