"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 dark:bg-[#111C30]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#26344B] shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <SportSyncLogo size="md" href="/" priority />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600 dark:text-[#94A3B8]">
          <a href="#features" className="hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors">
            Platform Features
          </a>
          <a href="#pipeline" className="hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors">
            How It Works
          </a>
          <a href="#roles" className="hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors">
            Role Portals
          </a>
          <a href="#contact" className="hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors">
            Contact Desk
          </a>
        </nav>

        {/* Desktop Buttons & Theme Toggle (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle align="right" />

          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-900/60 bg-white/80 dark:bg-[#0B1120]/80 px-3.5 py-1.5 text-xs font-bold text-brand-navy dark:text-[#F8FAFC] hover:bg-blue-50/70 dark:hover:bg-blue-950/40 hover:border-blue-300 dark:hover:border-blue-800 transition-all shadow-2xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-primary dark:text-[#4B8BFF]" />
            <span>Player Registration</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary dark:bg-[#4B8BFF] px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-brand-primaryHover dark:hover:bg-blue-600 transition-all gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>

        {/* Mobile Actions: Theme Toggle + Hamburger */}
        <div className="flex md:hidden items-center gap-2">
          <ThemeToggle align="right" variant="compact" />

          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 dark:text-[#94A3B8] hover:text-brand-navy dark:hover:text-[#F8FAFC] hover:bg-slate-100 dark:hover:bg-[#0B1120] focus:outline-hidden transition-colors cursor-pointer"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-brand-navy dark:text-[#F8FAFC]" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-[#26344B] bg-white/98 dark:bg-[#111C30]/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700 dark:text-[#94A3B8]">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B1120] hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors"
            >
              Platform Features
            </a>
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B1120] hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors"
            >
              How It Works
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B1120] hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors"
            >
              Role Portals
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-[#0B1120] hover:text-brand-primary dark:hover:text-[#4B8BFF] transition-colors"
            >
              Contact Desk
            </a>
          </nav>

          <div className="border-t border-slate-100 dark:border-[#26344B] pt-3 space-y-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 px-4 py-2.5 text-xs font-bold text-brand-navy dark:text-[#F8FAFC] hover:bg-blue-100/70 transition-all gap-2"
            >
              <UserPlus className="w-4 h-4 text-brand-primary dark:text-[#4B8BFF]" />
              <span>Player Registration</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center rounded-lg bg-brand-primary dark:bg-[#4B8BFF] px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-brand-primaryHover transition-all gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>Sign In</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
