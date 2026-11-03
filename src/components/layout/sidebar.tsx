"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-slate-200 bg-white transition-transform duration-200 ease-in-out lg:static lg:translate-x-0",
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

        {/* Footer info & sign out */}
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div>
              <p className="font-semibold text-brand-navy">Demo Mode</p>
              <p className="text-[10px]">SportSync v0.1.0</p>
            </div>
            <Link
              href="/login"
              className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
              title="Sign Out"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>
    </>
  );
}
