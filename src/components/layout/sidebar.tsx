"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Trophy,
  ShieldCheck,
  LogOut,
  X,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { label: "Overview", href: "/coach", icon: LayoutDashboard },
  { label: "Players", href: "/coach/players", icon: Users },
  { label: "Sessions", href: "/coach/sessions", icon: CalendarCheck },
  { label: "Matches", href: "/coach/matches", icon: Trophy },
  { label: "Readiness", href: "/coach/readiness", icon: ShieldCheck },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Ignore network errors and push to login
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-brand-navy/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:sticky lg:top-0 lg:h-screen lg:overflow-y-auto lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header with Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-slate-100">
          <SportSyncLogo size="sm" href="/coach" />
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 lg:hidden"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Academy Label */}
        <div className="px-6 py-3 bg-slate-50/70 border-b border-slate-100">
          <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
            Academy Desk
          </p>
          <p className="text-xs font-bold text-brand-navy truncate">Dumka Sports Academy</p>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  isActive
                    ? "bg-blue-50 text-brand-primary"
                    : "text-slate-600 hover:bg-slate-50 hover:text-brand-navy"
                )}
              >
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-brand-primary" : "text-slate-400 group-hover:text-brand-navy"
                  )}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Dedicated Sign Out Footer Button */}
        <div className="border-t border-slate-200 p-4 space-y-3">
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50/60 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-100/80 hover:text-rose-700 transition-colors shadow-2xs cursor-pointer"
          >
            <LogOut className="h-4 w-4 text-rose-500" />
            <span>Sign Out</span>
          </button>

          <div className="flex items-center justify-between text-[11px] text-slate-400 px-1">
            <span>Dumka Academy Desk</span>
            <span>v1.0.0</span>
          </div>
        </div>
      </aside>
    </>
  );
}
