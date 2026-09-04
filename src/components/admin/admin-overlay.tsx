"use client";

/**
 * Admin overlay — enterprise shell (Dashtrans/ABL-inspired).
 *
 * Layout contract (revised per client feedback 2026-09-04):
 *   - The left Sidebar carries the FULL navigation as vertical menu items:
 *     Overview | Products | Categories | Orders | Users | Offers & Spin |
 *     Settings. Collapses to an icon rail on small screens.
 *   - NO global tab row — the top area is a clean header/breadcrumb only.
 *   - Related sub-sections stay grouped behind small in-panel segmented
 *     controls (Products → Catalogue/Reviews, Offers → Banners/Spin Wheel,
 *     Settings → General/Delivery Zones) — every capability is preserved.
 *   - Premium tables, pagers and row-action menus are unchanged.
 *
 * Session gating, Escape-to-close, body scroll lock and the command palette
 * are unchanged. Mounted once from `src/app/page.tsx`.
 */

import { useEffect, useRef, useState } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Flower2,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Package,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
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
import CategoriesPanel from "./categories-panel";
import OrdersPanel from "./orders-panel";
import UsersPanel from "./users-panel";
import {
  OffersComposite,
  ProductsComposite,
  SettingsComposite,
} from "./admin-tabs";
import AdminCommandPalette from "./admin-command-palette";

type SectionId =
  | "overview"
  | "products"
  | "categories"
  | "orders"
  | "users"
  | "offers"
  | "settings";

/** Sidebar navigation — the seven main sections, vertical menu. */
const NAV_ITEMS: { id: SectionId; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "products", label: "Products", icon: Package },
  { id: "categories", label: "Categories", icon: FolderTree },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "users", label: "Users", icon: Users },
  { id: "offers", label: "Offers & Spin", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Store },
];

const SECTION_META: Record<SectionId, { title: string; sub: string }> = {
  overview: { title: "Admin Overview", sub: "PriyoUpohar at a glance" },
  products: { title: "Products", sub: "Curate the catalogue & moderate reviews" },
  categories: { title: "Categories", sub: "Organise collections" },
  orders: { title: "Orders", sub: "Fulfil & track deliveries" },
  users: { title: "Users", sub: "Manage accounts & roles" },
  offers: { title: "Offers & Spin", sub: "Promotions, banners & the prize wheel" },
  settings: { title: "Settings", sub: "Store configuration & delivery zones" },
};

/** Default sub-section whenever a composite section is opened. */
const DEFAULT_SUB: Partial<Record<SectionId, AdminTabId>> = {
  products: "products",
  offers: "offers",
  settings: "settings",
};

/** Command-palette / quick-link target → (section, sub tab). */
function resolveTarget(target: AdminTabId): { top: SectionId; sub?: AdminTabId } {
  switch (target) {
    case "reviews":
      return { top: "products", sub: "reviews" };
    case "spin":
      return { top: "offers", sub: "spin" };
    case "offers":
      return { top: "offers", sub: "offers" };
    case "locations":
      return { top: "settings", sub: "locations" };
    default:
      return { top: target as SectionId, sub: DEFAULT_SUB[target as SectionId] };
  }
}

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

export function AdminShell() {
  const token = useAdminStore((s) => s.token);
  const adminUser = useAdminStore((s) => s.adminUser);
  const logout = useAdminStore((s) => s.logout);

  const [section, setSection] = useState<SectionId>("overview");
  const [subTab, setSubTab] = useState<AdminTabId>("products");

  /* Sidebar navigation — picks a section and its default sub-tab. */
  const openSection = (id: SectionId) => {
    setSection(id);
    setSubTab(DEFAULT_SUB[id] ?? "products");
  };

  /* Deep-linkable navigation (palette, overview quick links). */
  const navigate = (target: AdminTabId) => {
    const { top, sub } = resolveTarget(target);
    openSection(top);
    if (sub) setSubTab(sub);
  };

  /* Session probe — flips the panel to the login screen on 401. */
  const meQuery = useQuery({
    queryKey: ["admin", "me", token],
    queryFn: () => pyFetch<AdminUser>("/api/auth/me", { token }),
    enabled: !!token,
    retry: false,
    refetchInterval: 120_000,
  });
  const sessionExpired =
    meQuery.isError && meQuery.error instanceof ApiError && meQuery.error.status === 401;
  const showLogin = !token || sessionExpired;

  return (
    <div className="flex h-screen w-full bg-background text-foreground">
          {showLogin ? (
            <AdminLogin />
          ) : (
            <div className="flex h-full w-full">
              <AdminSidebar
                section={section}
                onNavigate={openSection}
                adminUser={adminUser}
                onLogout={logout}
              />

              {/* Main column */}
              <div className="flex min-w-0 flex-1 flex-col">
                {/* Clean header — breadcrumb only (no global tabs) */}
                <header className="flex h-16 shrink-0 items-center justify-between gap-3 border-b border-border/70 bg-card px-4 md:px-6 dark:bg-stone-900/40">
                  <div className="flex min-w-0 items-center gap-1.5 text-sm">
                    <span className="hidden shrink-0 items-center gap-1.5 font-bold text-muted-foreground sm:flex">
                      <Store className="h-3.5 w-3.5" aria-hidden /> Store Management
                    </span>
                    <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-muted-foreground/60 sm:block" aria-hidden />
                    <span className="truncate font-extrabold text-foreground">
                      {SECTION_META[section].title}
                    </span>
                    <span className="hidden truncate text-muted-foreground lg:block">
                      — {SECTION_META[section].sub}
                    </span>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        document.dispatchEvent(
                          new KeyboardEvent("keydown", { key: "k", metaKey: true })
                        )
                      }
                      className="hidden h-9 gap-2 rounded-full pl-3 pr-2 text-xs text-muted-foreground sm:flex"
                      aria-label="Open command palette"
                    >
                      <Search className="h-3.5 w-3.5" aria-hidden />
                      <span>Search anything…</span>
                      <kbd className="pointer-events-none ml-3 hidden select-none items-center gap-0.5 rounded-md border bg-muted px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted-foreground md:flex">
                        Ctrl K
                      </kbd>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      asChild
                      aria-label="Back to store"
                      title="Back to store"
                      className="h-9 w-9 shrink-0 rounded-full"
                    >
                      <a href="/">
                        <X className="h-5 w-5" aria-hidden />
                      </a>
                    </Button>
                  </div>
                </header>

                {/* Workspace */}
                <main className="min-h-0 flex-1 overflow-y-auto p-4 scrollbar-slim md:p-6">
                  <div className="mx-auto max-w-7xl pb-6">
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.div
                        key={section}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                      >
                        {section === "overview" && <AdminOverview onNavigate={navigate} />}
                        {section === "products" && (
                          <ProductsComposite value={subTab} onValueChange={setSubTab} />
                        )}
                        {section === "categories" && <CategoriesPanel />}
                        {section === "orders" && <OrdersPanel />}
                        {section === "users" && <UsersPanel />}
                        {section === "offers" && (
                          <OffersComposite value={subTab} onValueChange={setSubTab} />
                        )}
                        {section === "settings" && (
                          <SettingsComposite value={subTab} onValueChange={setSubTab} />
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </main>

                <footer className="flex h-9 shrink-0 items-center justify-center border-t border-border/70 bg-card text-[11px] font-semibold text-muted-foreground dark:bg-stone-900/40">
                  © 2026 PriyoUpohar · Admin workspace
                </footer>
              </div>
            </div>
          )}

          {/* Global command palette (mounted once, outside section motion) */}
          {!showLogin && <AdminCommandPalette onNavigate={navigate} />}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sidebar — brand, FULL vertical navigation, user card                */
/* ------------------------------------------------------------------ */

function AdminSidebar({
  section,
  onNavigate,
  adminUser,
  onLogout,
}: {
  section: SectionId;
  onNavigate: (id: SectionId) => void;
  adminUser: AdminUser | null;
  onLogout: () => void;
}) {
  return (
    <nav
      aria-label="Admin workspace"
      className="flex w-14 shrink-0 flex-col border-r border-border/70 bg-card md:w-60 dark:bg-stone-900/40"
    >
      {/* Brand */}
      <div className="flex h-16 items-center justify-center gap-2.5 border-b border-border/70 px-3 md:justify-start md:px-4">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-brand text-white shadow-soft">
          <Flower2 className="h-4.5 w-4.5" aria-hidden />
        </span>
        <span className="hidden min-w-0 md:block">
          <span className="block truncate text-sm font-extrabold leading-tight text-foreground">
            PriyoUpohar
          </span>
          <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-brand dark:text-rose-400">
            <ShieldCheck className="h-3 w-3" aria-hidden /> Admin panel
          </span>
        </span>
      </div>

      {/* Vertical navigation */}
      <div className="flex-1 overflow-y-auto p-2 scrollbar-slim md:p-3">
        <p className="hidden px-2 pb-2 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground/70 md:block">
          Navigation
        </p>
        <ul className="space-y-1" role="list">
          {NAV_ITEMS.map((item) => {
            const active = section === item.id;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onNavigate(item.id)}
                  aria-current={active ? "page" : undefined}
                  title={item.label}
                  className={cn(
                    "group relative flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-bold transition-colors md:justify-start",
                    active
                      ? "bg-brand-soft text-brand shadow-none dark:bg-rose-950/60 dark:text-rose-300"
                      : "text-stone-600 hover:bg-muted/60 hover:text-foreground dark:text-stone-300 dark:hover:bg-stone-800/70 dark:hover:text-white"
                  )}
                >
                  {/* Active accent bar (desktop) */}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute inset-y-1.5 left-0 hidden w-1 rounded-full bg-brand dark:bg-rose-400 md:block"
                    />
                  )}
                  <item.icon className="h-4.5 w-4.5 shrink-0" aria-hidden />
                  <span className="hidden flex-1 truncate text-left md:inline">
                    {item.label}
                  </span>
                  {active && (
                    <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 opacity-60 md:block" aria-hidden />
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* User card + logout */}
      <div className="border-t border-border/70 p-2 md:p-3">
        <div className="flex items-center gap-2.5 rounded-xl px-1 py-1.5 md:px-2">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gradient-brand text-[11px] font-extrabold text-white">
            {(adminUser?.name ?? "A")
              .split(/\s+/)
              .slice(0, 2)
              .map((w) => w[0]?.toUpperCase() ?? "")
              .join("")}
          </span>
          <span className="hidden min-w-0 flex-1 md:block">
            <span className="block truncate text-xs font-extrabold text-foreground">
              {adminUser?.name ?? "Admin"}
            </span>
            <span className="block truncate text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
              {adminUser?.email ?? "admin"}
            </span>
          </span>
          <Button
            variant="ghost"
            size="icon"
            onClick={onLogout}
            aria-label="Log out of admin panel"
            title="Log out"
            className="h-8 w-8 shrink-0 rounded-lg text-stone-500 hover:bg-rose-50 hover:text-rose-700 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      </div>
    </nav>
  );
}
