"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AdminUser } from "@/lib/py-api";

/**
 * Admin panel session state.
 *
 * Persisted: token + adminUser (key "bb-admin") so a page refresh keeps the
 * admin signed in. `isOpen` is intentionally transient — the overlay always
 * starts closed so a reload lands back on the storefront.
 */
type AdminState = {
  isOpen: boolean;
  token: string | null;
  adminUser: AdminUser | null;
  openAdmin: () => void;
  closeAdmin: () => void;
  setAuth: (token: string, user: AdminUser) => void;
  logout: () => void;
};

export const useAdminStore = create<AdminState>()(
  persist(
    (set) => ({
      isOpen: false,
      token: null,
      adminUser: null,
      openAdmin: () => set({ isOpen: true }),
      closeAdmin: () => set({ isOpen: false }),
      setAuth: (token, user) => set({ token, adminUser: user }),
      logout: () => set({ token: null, adminUser: null, isOpen: false }),
    }),
    {
      name: "bb-admin",
      partialize: (s) => ({ token: s.token, adminUser: s.adminUser }),
    }
  )
);
