"use client";

/**
 * Admin overlay — a full-screen client-side panel (NOT a route).
 * Mounted once from `src/app/page.tsx`; opened via the header shield button.
 *
 * Handles: session gating (login screen when token missing/401),
 * Escape-to-close, body scroll lock and panel switching.
 */

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Flower2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  ShieldCheck,
  ShoppingBag,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAdminStore } from "@/lib/admin-store";
import { useMounted } from "@/hooks/use-mounted";
import { ApiError, pyFetch, type AdminUser } from "@/lib/py-api";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import type { AdminTabId } from "./admin-ui";
import AdminLogin from "./admin-login";
import AdminOverview from "./admin-overview";
import ProductsPanel from "./products-panel";
import CategoriesPanel from "./categories-panel";
import OrdersPanel from "./orders-panel";
import UsersPanel from "./users-panel";

const NAV: { id: AdminTabId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
];

const PANEL_TITLES: Record<AdminTabId, { title: string; sub: string }> = {
  overview: { title: "Admin Overview", sub: "Bloom & Bliss at a glance" },
  products: { title: "Products", sub: "Curate the catalogue" },
  categories: { title: "Categories", sub: "Organise collections" },
  orders: { title: "Orders", sub: "Fulfil & track deliveries" },
  users: { title: "Users", sub: "Manage accounts & roles" },
};

export default function AdminOverlay() {
  const mounted = useMounted();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 15_000, retry: 1, refetchOnWindowFocus: false },
        },
      })
  );

  if (!mounted) return null;

  return (
    <>
      <Toaster position="bottom-right" closeButton />
      <QueryClientProvider client={queryClient}>
        <AdminShell />
      </QueryClientProvider>
    </>
  );
}

function AdminShell() {
  const isOpen = useAdminStore((s) => s.isOpen);
  const token = useAdminStore((s) => s.token);
  const adminUser = useAdminStore((s) => s.adminUser);
  const closeAdmin = useAdminStore((s) => s.closeAdmin);
  const logout = useAdminStore((s) => s.logout);

  const [tab, setTab] = useState<AdminTabId>("overview");
  const containerRef = useRef<HTMLDivElement>(null);

  /* Session probe — flips the panel to the login screen on 401. */
  const meQuery = useQuery({
    queryKey: ["admin", "me", token],
    queryFn: () => pyFetch<AdminUser>("/api/auth/me", { token }),
    enabled: isOpen && !!token,
    retry: false,
    refetchInterval: 120_000,
  });
  const sessionExpired =
    meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;
  const showLogin = !token || sessionExpired;

  /* Body scroll lock while the overlay is open. */
  useEffect(() => {
    if (!isOpen) return;
    const prevOverflow = document.body.style.overflow;
    const prevPadding = document.body.style.paddingRight;
    document.body.style.overflow = "hidden";
    containerRef.current?.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPadding;
    };
  }, [isOpen]);

  /* Escape closes the overlay — but lets inner dialogs/popovers win first. */
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      const innerLayer = document.querySelector(
        '[role="dialog"][data-state="open"], [role="alertdialog"][data-state="open"], [data-radix-popper-content-wrapper]'
      );
      if (innerLayer) return;
      closeAdmin();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, closeAdmin]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="bb-admin-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl"
          role="dialog"
          aria-modal="true"
          aria-label="Bloom & Bliss admin panel"
          ref={containerRef}
          tabIndex={-1}
        >
          {showLogin ? (
                <AdminLogin />
              ) : (
                <div className="flex h-full w-full">
                  {/* Sidebar — icons-only below md */}
                  <nav
                    aria-label="Admin sections"
                    className="flex w-14 shrink-0 flex-col border-r bg-card/60 backdrop-blur md:w-56 dark:bg-stone-900/40"
                  >
                    <div className="flex h-16 items-center justify-center gap-2.5 border-b px-3 md:justify-start md:px-4">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-soft">
                        <Flower2 className="h-4.5 w-4.5" aria-hidden />
                      </span>
                      <span className="hidden min-w-0 md:block">
                        <span className="block truncate text-sm font-extrabold leading-tight text-foreground">
                          Bloom &amp; Bliss
                        </span>
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand dark:text-rose-400">
                          <ShieldCheck className="h-3 w-3" aria-hidden /> Admin panel
                        </span>
                      </span>
                    </div>

                    <div className="flex-1 space-y-1 overflow-y-auto p-2 scrollbar-slim">
                      {NAV.map((item) => {
                        const active = tab === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setTab(item.id)}
                            aria-current={active ? "page" : undefined}
                            title={item.label}
                            className={cn(
                              "flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors",
                              active
                                ? "bg-brand-soft text-brand dark:bg-rose-950/60 dark:text-rose-300"
                                : "text-stone-600 hover:bg-rose-50 hover:text-brand dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-rose-300"
                            )}
                          >
                            <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                            <span className="hidden md:inline">{item.label}</span>
                            {!active && <span className="sr-only md:hidden">{item.label}</span>}
                          </button>
                        );
                      })}
                    </div>

                    <div className="border-t p-2 md:p-3">
                      <div className="hidden items-center gap-2 px-1 pb-2 md:flex">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-brand text-[11px] font-extrabold text-white">
                          {(adminUser?.name ?? "A")
                            .split(/\s+/)
                            .slice(0, 2)
                            .map((w) => w[0]?.toUpperCase() ?? "")
                            .join("")}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-xs font-extrabold text-foreground">
                            {adminUser?.name ?? "Admin"}
                          </span>
                          <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                            {adminUser?.role ?? "admin"}
                          </span>
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={logout}
                        className="w-full justify-center gap-2 rounded-xl text-xs font-bold text-stone-600 hover:bg-rose-50 hover:text-rose-700 md:justify-start dark:text-stone-300 dark:hover:bg-stone-800 dark:hover:text-rose-300"
                        aria-label="Log out of admin panel"
                      >
                        <LogOut className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="hidden md:inline">Log out</span>
                      </Button>
                    </div>
                  </nav>

                  {/* Main area */}
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-card/60 px-4 backdrop-blur md:px-6 dark:bg-stone-900/40">
                      <div className="min-w-0">
                        <h1 className="truncate text-base font-extrabold tracking-tight text-foreground md:text-lg">
                          {PANEL_TITLES[tab].title}
                        </h1>
                        <p className="hidden truncate text-xs text-muted-foreground sm:block">
                          {PANEL_TITLES[tab].sub}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={closeAdmin}
                        aria-label="Close admin panel"
                        title="Close (Esc)"
                        className="h-9 w-9 shrink-0 rounded-xl"
                      >
                        <X className="h-5 w-5" aria-hidden />
                      </Button>
                    </div>

                    <main className="flex-1 overflow-y-auto p-4 scrollbar-slim md:p-6">
                      <div className="mx-auto max-w-6xl pb-8">
                        <AnimatePresence mode="wait" initial={false}>
                          <motion.div
                            key={tab}
                            initial={{ opacity: 0, y: 14 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.22, ease: "easeOut" }}
                          >
                            {tab === "overview" && <AdminOverview onNavigate={setTab} />}
                            {tab === "products" && <ProductsPanel />}
                            {tab === "categories" && <CategoriesPanel />}
                            {tab === "orders" && <OrdersPanel />}
                            {tab === "users" && <UsersPanel />}
                          </motion.div>
                        </AnimatePresence>
                      </div>
                    </main>
                  </div>
                </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
