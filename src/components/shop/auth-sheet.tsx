"use client";

/**
 * Storefront login/register + account sheet (Task 2.4).
 * Logged out → auth forms. Logged in → profile, order history, logout.
 */

import { useState, useEffect, useCallback } from "react";
import {
  LogIn, UserPlus, Loader2, LogOut, Package, RefreshCw, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { pyFetch, ApiError, type LoginResponse, type AdminOrder } from "@/lib/py-api";
import { useCustomerAuthStore } from "@/lib/customer-auth-store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";

/**
 * Shared customer auth hook — backed by the zustand persist store so every
 * consumer (header button, sheet, checkout) sees the same session instantly.
 * `loading` is true until after mount, avoiding SSR/hydration mismatches.
 */
export function useCustomerAuth() {
  const stored = useCustomerAuthStore((s) => s.auth);
  const setStoreAuth = useCustomerAuthStore((s) => s.setAuth);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(t);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await pyFetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    setStoreAuth(res);
    return res;
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await pyFetch<LoginResponse>("/api/auth/register", {
      method: "POST",
      body: { name, email, password },
    });
    setStoreAuth(res);
    return res;
  };

  const logout = () => setStoreAuth(null);

  return { auth: mounted ? stored : null, loading: !mounted, login, register, logout };
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  confirmed: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  preparing: "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
  shipped: "bg-violet-100 text-violet-800 dark:bg-violet-950 dark:text-violet-300",
  delivered: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  cancelled: "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300",
};

/** Logged-in view: profile + order history. */
function AccountView({ auth, onLogout }: { auth: LoginResponse; onLogout: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[] | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    pyFetch<{ items: AdminOrder[] }>("/api/store/my-orders", { token: auth.access_token })
      .then((res) => setOrders(res.items))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [auth.access_token]);

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 px-4 pb-6">
      <div className="flex items-center gap-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 dark:border-stone-800 dark:from-stone-900 dark:to-stone-900">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-brand text-sm font-extrabold text-white">
          {auth.user.name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("")}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm font-extrabold text-foreground">{auth.user.name}</span>
          <span className="block truncate text-xs text-muted-foreground">{auth.user.email}</span>
        </span>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wide text-stone-500 dark:text-stone-400">
          <Package className="h-3.5 w-3.5" aria-hidden /> My orders
        </h3>
        <Button variant="ghost" size="sm" onClick={load} disabled={loading}
          className="h-7 gap-1 rounded-lg px-2 text-[11px] font-bold text-muted-foreground" aria-label="Refresh orders">
          <RefreshCw className={loading ? "h-3 w-3 animate-spin" : "h-3 w-3"} aria-hidden /> Refresh
        </Button>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto scrollbar-slim">
        {orders === null && (
          <div className="space-y-2" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-stone-100 dark:bg-stone-800" />
            ))}
          </div>
        )}
        {orders?.length === 0 && (
          <div className="rounded-2xl border border-dashed border-stone-200 p-6 text-center dark:border-stone-700">
            <Sparkles className="mx-auto h-5 w-5 text-gold" aria-hidden />
            <p className="mt-2 text-xs font-semibold text-muted-foreground">
              No orders yet — your gift history will appear here.
            </p>
          </div>
        )}
        {orders?.map((o) => (
          <div key={o.id} className="rounded-2xl border border-stone-200 bg-card p-3 dark:border-stone-800 dark:bg-stone-900">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-extrabold text-foreground">{o.order_number}</span>
              <Badge className={STATUS_STYLES[o.status] ?? ""} variant="secondary">
                {o.status}
              </Badge>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>{new Date(o.created_at).toLocaleDateString()}</span>
              <span className="font-extrabold text-foreground">₹{Number(o.total).toFixed(0)}</span>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        onClick={() => { onLogout(); toast.success("Signed out"); }}
        className="w-full gap-2 rounded-xl font-bold text-rose-700 hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-stone-800"
        aria-label="Sign out"
      >
        <LogOut className="h-4 w-4" aria-hidden /> Sign out
      </Button>
    </div>
  );
}

export default function AuthSheet({
  open, onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const { auth, login, register, logout } = useCustomerAuth();

  useEffect(() => {
    if (open) { setName(""); setEmail(""); setPassword(""); setErrors({}); setMode("login"); }
  }, [open]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (mode === "register" && !name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email";
    if (!password || password.length < 6) e.password = "Min 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || submitting) return;
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
        toast.success("Welcome back!");
      } else {
        await register(name, email, password);
        toast.success("Account created!");
      }
      onOpenChange(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ form: msg });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full max-w-md flex-col sm:max-w-sm">
        {auth ? (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg font-extrabold">My account</SheetTitle>
              <SheetDescription>Track orders and manage your profile.</SheetDescription>
            </SheetHeader>
            <AccountView auth={auth} onLogout={logout} />
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="text-lg font-extrabold">
                {mode === "login" ? "Welcome back" : "Create account"}
              </SheetTitle>
              <SheetDescription>
                {mode === "login"
                  ? "Sign in to track orders and earn rewards."
                  : "Join Bloom & Bliss for a personalised experience."}
              </SheetDescription>
            </SheetHeader>

        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-4 px-4 pb-6">
          {errors.form && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-700">
              {errors.form}
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-1.5">
              <Label htmlFor="auth-name" className="text-xs font-bold">Full name</Label>
              <Input
                id="auth-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ananya Sharma"
                className="rounded-xl"
              />
              {errors.name && <p className="text-[11px] text-rose-500">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="auth-email" className="text-xs font-bold">Email</Label>
            <Input
              id="auth-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-xl"
            />
            {errors.email && <p className="text-[11px] text-rose-500">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="auth-pass" className="text-xs font-bold">Password</Label>
            <Input
              id="auth-pass"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Min 6 characters"
              className="rounded-xl"
            />
            {errors.password && <p className="text-[11px] text-rose-500">{errors.password}</p>}
          </div>

          <Button
            type="submit"
            disabled={submitting}
            className="w-full gap-2 rounded-xl bg-gradient-brand font-extrabold text-white hover:bg-rose-700"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "login" ? (
              <LogIn className="h-4 w-4" />
            ) : (
              <UserPlus className="h-4 w-4" />
            )}
            {submitting ? "Please wait…" : mode === "login" ? "Sign in" : "Create account"}
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button type="button" className="font-bold text-brand hover:underline" onClick={() => setMode("register")}>
                  Sign up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button type="button" className="font-bold text-brand hover:underline" onClick={() => setMode("login")}>
                  Sign in
                </button>
              </>
            )}
          </p>
        </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
