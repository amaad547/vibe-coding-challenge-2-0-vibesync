"use client";

import * as React from "react";
import Link from "next/link";
import { Menu, X, LogIn, UserPlus } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";

export function LandingNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <SportSyncLogo size="md" href="/" priority />

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
          <a href="#features" className="hover:text-brand-primary transition-colors">
            Platform Features
          </a>
          <a href="#pipeline" className="hover:text-brand-primary transition-colors">
            How It Works
          </a>
          <a href="#roles" className="hover:text-brand-primary transition-colors">
            Role Portals
          </a>
          <a href="#contact" className="hover:text-brand-primary transition-colors">
            Contact Desk
          </a>
        </nav>

        {/* Desktop Buttons (Hidden on mobile) */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-blue-200 bg-white/80 px-3.5 py-1.5 text-xs font-bold text-brand-navy hover:bg-blue-50/70 hover:border-blue-300 transition-all shadow-2xs gap-1.5"
          >
            <UserPlus className="w-3.5 h-3.5 text-brand-primary" />
            <span>Player Registration</span>
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-brand-primaryHover transition-all gap-1.5 hover:scale-[1.02] active:scale-[0.98]"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </Link>
        </div>

        {/* Mobile Hamburger Button (Visible on mobile only) */}
        <div className="flex md:hidden items-center">
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="inline-flex items-center justify-center p-2 rounded-lg text-slate-600 hover:text-brand-navy hover:bg-slate-100 focus:outline-none transition-colors"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6 text-brand-navy" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white/98 backdrop-blur-md px-4 pt-3 pb-5 space-y-3 shadow-lg animate-in fade-in slide-in-from-top-2 duration-150">
          <nav className="flex flex-col space-y-2 text-sm font-semibold text-slate-700">
            <a
              href="#features"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-brand-primary transition-colors"
            >
              Platform Features
            </a>
            <a
              href="#pipeline"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-brand-primary transition-colors"
            >
              How It Works
            </a>
            <a
              href="#roles"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-brand-primary transition-colors"
            >
              Role Portals
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-100 hover:text-brand-primary transition-colors"
            >
              Contact Desk
            </a>
          </nav>

          <div className="border-t border-slate-100 pt-3 space-y-2">
            <Link
              href="/register"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-xs font-bold text-brand-navy hover:bg-blue-100/70 transition-all gap-2"
            >
              <UserPlus className="w-4 h-4 text-brand-primary" />
              <span>Player Registration</span>
            </Link>
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-brand-primaryHover transition-all gap-2"
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

