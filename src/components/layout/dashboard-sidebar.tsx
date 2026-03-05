"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import {
  LayoutDashboard,
  Map,
  Plus,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  X,
  Globe2,
  MessageSquare,
} from "lucide-react";
import { useUiStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import type { Session } from "next-auth";
import { useEffect } from "react";

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/trips", icon: Map, label: "My Trips" },
  { href: "/explore", icon: Globe2, label: "Explore" },
  { href: "/chat", icon: MessageSquare, label: "AI Chat" },
  { href: "/trips/new", icon: Plus, label: "New Trip", highlight: true },
];

const BOTTOM_ITEMS = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/billing", icon: CreditCard, label: "Billing" },
];

interface DashboardSidebarProps {
  user: Session["user"];
}

function PlanoraMark({ size = "md" }: { size?: "sm" | "md" }) {
  const s = size === "sm" ? "h-7 w-7 rounded-lg" : "h-8 w-8 rounded-xl";
  return (
    <div className={cn("relative flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600 shadow-md shadow-violet-500/30 shrink-0", s)}>
      <span className="text-white text-sm font-black">P</span>
      <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border-2 border-card" />
    </div>
  );
}

function SidebarContent({
  user,
  expanded,
  onClose,
}: {
  user: Session["user"];
  expanded: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-4 shrink-0">
        <div className="flex items-center justify-between w-full">
          <Link
            href="/dashboard"
            className="flex items-center gap-2.5 font-bold text-lg group"
            onClick={onClose}
          >
            <PlanoraMark />
            {expanded && (
              <span className="gradient-heading truncate tracking-tight">Planora</span>
            )}
          </Link>
          {/* Mobile close button */}
          {onClose && (
            <button
              onClick={onClose}
              className="lg:hidden flex h-8 w-8 items-center justify-center rounded-lg hover:bg-accent transition-colors text-muted-foreground"
              aria-label="Close menu"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 p-3 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : item.highlight
                  ? "border border-dashed border-primary/50 text-primary hover:bg-primary/5"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                !expanded && "justify-center"
              )}
              title={!expanded ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t p-3 space-y-1 shrink-0">
        {BOTTOM_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
                !expanded && "justify-center"
              )}
              title={!expanded ? item.label : undefined}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {expanded && <span>{item.label}</span>}
            </Link>
          );
        })}

        {/* User info */}
        {expanded && (
          <div className="flex items-center gap-3 rounded-lg px-3 py-2 mt-2">
            <div className="h-7 w-7 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
              {user.name?.[0]?.toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">{user.name}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export function DashboardSidebar({ user }: DashboardSidebarProps) {
  const { sidebarOpen, toggleSidebar, mobileSidebarOpen, setMobileSidebarOpen } = useUiStore();

  // Close mobile sidebar on route change
  const pathname = usePathname();
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [pathname, setMobileSidebarOpen]);

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileSidebarOpen]);

  return (
    <>
      {/* ── Desktop sidebar (lg+) ── */}
      <aside
        className={cn(
          "relative hidden lg:flex flex-col border-r bg-card transition-all duration-300",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <SidebarContent user={user} expanded={sidebarOpen} />

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-20 flex h-6 w-6 items-center justify-center rounded-full border bg-background shadow-md hover:bg-accent transition-colors z-10"
          aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          {sidebarOpen ? (
            <ChevronLeft className="h-3 w-3" />
          ) : (
            <ChevronRight className="h-3 w-3" />
          )}
        </button>
      </aside>

      {/* ── Mobile overlay drawer (< lg) ── */}
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden transition-opacity duration-300",
          mobileSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setMobileSidebarOpen(false)}
        aria-hidden="true"
      />

      {/* Drawer panel */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-72 flex flex-col bg-card border-r shadow-2xl lg:hidden transition-transform duration-300 ease-in-out",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <SidebarContent
          user={user}
          expanded
          onClose={() => setMobileSidebarOpen(false)}
        />
      </div>
    </>
  );
}
