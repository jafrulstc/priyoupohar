"use client";

/**
 * Admin command palette — Ctrl+K (or Cmd+K) to jump between
 * panels, trigger actions, or log out.
 */

import { useEffect, useState } from "react";
import {
  FolderTree,
  LayoutDashboard,
  LogOut,
  MapPin,
  Megaphone,
  Package,
  RotateCw,
  Search,
  Settings,
  ShoppingBag,
  Star,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { AdminTabId } from "./admin-ui";
import { useAdminStore } from "@/lib/admin-store";

type CommandAction = {
  id: string;
  label: string;
  shortcut?: string;
  icon: LucideIcon;
  section: string;
  onSelect: () => void;
};

export default function AdminCommandPalette({
  onNavigate,
}: {
  onNavigate: (tab: AdminTabId) => void;
}) {
  const [open, setOpen] = useState(false);
  const logout = useAdminStore((s) => s.logout);

  const NAV_ITEMS: { id: AdminTabId; label: string; icon: LucideIcon }[] = [
    { id: "overview", label: "Go to Overview", icon: LayoutDashboard },
    { id: "products", label: "Go to Products", icon: Package },
    { id: "categories", label: "Go to Categories", icon: FolderTree },
    { id: "orders", label: "Go to Orders", icon: ShoppingBag },
    { id: "users", label: "Go to Users", icon: Users },
    { id: "settings", label: "Go to Settings", icon: Settings },
    { id: "locations", label: "Go to Locations", icon: MapPin },
    { id: "offers", label: "Go to Offers", icon: Megaphone },
    { id: "spin", label: "Go to Spin Wheel", icon: RotateCw },
    { id: "reviews", label: "Go to Reviews", icon: Star },
  ];

  const run = (fn: () => void) => {
    setOpen(false);
    fn();
  };

  /* Global keyboard shortcut */
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          {NAV_ITEMS.map((item) => (
            <CommandItem
              key={item.id}
              onSelect={() => run(() => onNavigate(item.id))}
            >
              <item.icon className="mr-2 h-4 w-4" aria-hidden />
              {item.label}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => run(logout)}>
            <LogOut className="mr-2 h-4 w-4" aria-hidden />
            Log out
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
