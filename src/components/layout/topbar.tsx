"use client";

import * as React from "react";
import { Menu, Bell, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopbarProps {
  onMenuClick: () => void;
  title?: string;
  role?: "COACH" | "PLAYER" | "SCOUT";
}

export function Topbar({ onMenuClick, title = "Overview", role = "COACH" }: TopbarProps) {
  const roleBadgeMap = {
    COACH: { label: "Coach Desk", variant: "primary" as const },
    PLAYER: { label: "Player Portal", variant: "info" as const },
    SCOUT: { label: "Scout Registry", variant: "success" as const },
  };

  const currentRole = roleBadgeMap[role];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur-sm sm:px-6">
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

        <button
          type="button"
          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-brand-navy transition-colors relative"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-brand-primary" />
        </button>

        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-bold flex items-center justify-center">
            D
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-brand-navy leading-tight">Coach Desk</p>
            <p className="text-[10px] text-slate-500">Dumka Academy</p>
          </div>
        </div>
      </div>
    </header>
  );
}
