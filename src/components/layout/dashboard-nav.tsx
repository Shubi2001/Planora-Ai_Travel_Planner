"use client";

import { Bell, Moon, Sun, LogOut, Menu } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useUiStore } from "@/stores/ui-store";
import type { Session } from "next-auth";

interface DashboardNavProps {
  user: Session["user"];
}

const PAGE_TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/trips": "My Trips",
  "/trips/new": "New Trip",
  "/explore": "Explore",
  "/chat": "AI Chat",
  "/settings": "Settings",
  "/billing": "Billing",
};

export function DashboardNav({ user }: DashboardNavProps) {
  const { theme, setTheme } = useTheme();
  const { toggleMobileSidebar } = useUiStore();
  const pathname = usePathname();

  const pageTitle =
    PAGE_TITLES[pathname] ??
    (pathname.includes("/edit") ? "Trip Editor" : "Planora");

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b bg-card/50 backdrop-blur-sm px-3 md:px-6 shrink-0">
      {/* Left: hamburger (mobile) + page title */}
      <div className="flex items-center gap-2">
        {/* Hamburger — only on mobile */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden h-9 w-9"
          onClick={toggleMobileSidebar}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
        {/* Page title — mobile only */}
        <span className="lg:hidden text-sm font-semibold text-foreground">{pageTitle}</span>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1 md:gap-2">
        {/* Plan badge */}
        {(user as { plan?: string }).plan === "PRO" ? (
          <Badge
            variant="default"
            className="hidden sm:flex bg-gradient-to-r from-indigo-500 to-violet-500 text-white border-0 text-xs"
          >
            PRO
          </Badge>
        ) : (
          <Badge variant="outline" className="hidden sm:flex text-xs">FREE</Badge>
        )}

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        {/* User avatar + sign out */}
        <div className="flex items-center gap-1.5 pl-2 border-l ml-1">
          <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-gradient-to-br from-indigo-400 to-violet-400 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {user.name?.[0]?.toUpperCase() ?? "U"}
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => signOut({ callbackUrl: "/" })}
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </header>
  );
}
