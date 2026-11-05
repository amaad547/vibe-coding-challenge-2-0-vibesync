"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, Shield, LogOut } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  role?: "COACH" | "PLAYER" | "SCOUT";
}

export function Topbar({ onMenuClick, title = "Overview", role = "COACH" }: TopbarProps) {
  const router = useRouter();

  const roleBadgeMap = {
    COACH: { label: "Coach Desk", variant: "primary" as const },
    PLAYER: { label: "Player Portal", variant: "info" as const },
    SCOUT: { label: "Scout Registry", variant: "success" as const },
  };

  const currentRole = roleBadgeMap[role];

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to login page regardless of network state
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur-md sm:px-6 shadow-xs transition-all">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-brand-navy lg:hidden transition-colors"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div>
          <h1 className="text-base sm:text-lg font-bold text-brand-navy leading-none">{title}</h1>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant={currentRole.variant} dot>
          <Shield className="h-3 w-3 mr-1 inline-block" />
          {currentRole.label}
        </Badge>

        {role === "COACH" ? (
          <Link
            href="/coach/profile"
            className="flex items-center gap-2 pl-2 border-l border-slate-200 group transition-all"
            title="Click to view & edit Coach Profile and Contact Details"
          >
            <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center shadow-xs ring-2 ring-transparent group-hover:ring-brand-primary group-hover:bg-brand-primary group-hover:scale-105 transition-all">
              C
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-brand-navy group-hover:text-brand-primary leading-tight transition-colors">
                Coach Desk
              </p>
              <p className="text-[10px] text-slate-500 group-hover:text-slate-700">Edit Profile &rarr;</p>
            </div>
          </Link>
        ) : (
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">
              {role.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-brand-navy leading-tight">
                {role === "SCOUT" ? "Scout Desk" : "Athlete Desk"}
              </p>
              <p className="text-[10px] text-slate-500">Dumka Academy</p>
            </div>
          </div>
        )}

        {/* Working Sign Out Button */}
        <button
          type="button"
          onClick={handleLogout}
          className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors shadow-2xs"
          title="Sign out of SportSync"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign Out</span>
        </button>
      </div>
    </header>
  );
}
