"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { LoginResponse } from "@/lib/py-api";

/**
 * Customer auth session (Task 2.4) — shared between the header account
 * button and the AuthSheet so both react to login/logout instantly.
 * Persisted (key "bb-customer-auth") so a refresh keeps the customer signed in.
 */
type CustomerAuthState = {
  auth: LoginResponse | null;
  setAuth: (auth: LoginResponse | null) => void;
};

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set) => ({
      auth: null,
      setAuth: (auth) => set({ auth }),
    }),
    {
      name: "bb-customer-auth",
      partialize: (s) => ({ auth: s.auth }),
    }
  )
);
