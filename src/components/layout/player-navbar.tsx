"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Sparkles,
  Calendar,
  CalendarCheck,
  Trophy,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface PlayerNavbarProps {
  player?: {
    name: string;
    sport: string;
  } | null;
  isReady?: boolean;
  activitiesCount?: number;
  sessionsCount?: number;
  matchesCount?: number;
}

export function PlayerNavbar({
  player,
  isReady,
  activitiesCount,
  sessionsCount,
  matchesCount,
}: PlayerNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to login
    }
    router.push("/login");
    router.refresh();
  };

  const navItems = [
    {
      href: "/player",
      label: "Trial Readiness & Overview",
      icon: Sparkles,
      isActive: pathname === "/player",
      badge: isReady ? "Ready" : null,
      badgeColor: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400",
    },
    {
      href: "/player/calendar",
      label: "Upcoming Schedule & Calendar",
      icon: Calendar,
      isActive: pathname.startsWith("/player/calendar"),
      badge: activitiesCount !== undefined && activitiesCount > 0 ? String(activitiesCount) : null,
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400",
    },
    {
      href: "/player/sessions",
      label: "Practice Attendance Log",
      icon: CalendarCheck,
      isActive: pathname.startsWith("/player/sessions"),
      badge: sessionsCount !== undefined ? String(sessionsCount) : null,
      badgeColor: "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
    {
      href: "/player/matches",
      label: "Match Performances",
      icon: Trophy,
      isActive: pathname.startsWith("/player/matches"),
      badge: matchesCount !== undefined ? String(matchesCount) : null,
      badgeColor: "bg-slate-200/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/90 dark:border-[#26344B] bg-white/95 dark:bg-[#111C30]/95 backdrop-blur-md shadow-xs transition-all">
      {/* Main Branding & Athlete Info Row */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <SportSyncLogo size="sm" href="/player" />
          <Badge variant="info" dot className="font-semibold text-xs hidden sm:inline-flex">
            Athlete Portal
          </Badge>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <ThemeToggle align="right" />

          {player && (
            <div className="hidden sm:flex items-center gap-2 pl-2 text-right">
              <div>
                <p className="text-xs font-bold text-brand-navy leading-tight">{player.name}</p>
                <p className="text-[10px] text-slate-500 dark:text-[#94A3B8] uppercase">{player.sport}</p>
              </div>
              <div className="h-8 w-8 rounded-full bg-brand-primary text-white text-xs font-bold flex items-center justify-center shadow-2xs">
                {player.name.charAt(0)}
              </div>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
            className="text-xs font-bold rounded-lg border-slate-200 dark:border-[#26344B] text-slate-600 dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 hover:border-rose-200 dark:hover:border-rose-800 transition-colors"
          >
            Sign Out
          </Button>

          {/* Mobile Hamburger Button for Section Navigation */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-[#94A3B8] hover:text-brand-navy dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#0B1120] focus:outline-hidden transition-colors border border-slate-200 dark:border-[#26344B]"
            aria-label="Toggle section navigation menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? (
              <X className="h-5 w-5 text-brand-navy dark:text-[#F8FAFC]" />
            ) : (
              <Menu className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Section Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#26344B] bg-white/98 dark:bg-[#111C30]/98 backdrop-blur-md px-4 py-3 space-y-2 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 dark:text-[#94A3B8] px-1 pb-1">
            Portal Sections
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                  item.isActive
                    ? "bg-blue-50 dark:bg-blue-950/50 text-brand-primary dark:text-[#4B8BFF] border border-blue-200 dark:border-blue-900/60 shadow-2xs"
                    : "text-slate-700 dark:text-[#94A3B8] hover:bg-slate-50 dark:hover:bg-[#0B1120]"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-brand-primary dark:text-[#4B8BFF]" />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {/* Desktop Section Navigation Navbar (Hidden on mobile) */}
      <div className="hidden md:block border-t border-slate-200/70 dark:border-[#26344B]/80 bg-slate-100/70 dark:bg-[#0B1120]/70 px-4 sm:px-6 lg:px-8 py-1.5">
        <nav className="max-w-7xl mx-auto flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar py-0.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                  item.isActive
                    ? "bg-white dark:bg-[#111C30] text-brand-primary dark:text-[#4B8BFF] shadow-2xs border border-blue-200/80 dark:border-[#4B8BFF]/40"
                    : "text-slate-600 dark:text-[#94A3B8] hover:text-brand-navy dark:hover:text-[#F8FAFC] hover:bg-white/60 dark:hover:bg-[#111C30]/60"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
                {item.badge && item.label !== "Trial Readiness & Overview" && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
