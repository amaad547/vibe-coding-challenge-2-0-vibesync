import Link from "next/link";
import { ShieldCheck, Users, Trophy, ArrowRight, Activity } from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col justify-between bg-brand-surface text-brand-navy">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <SportSyncLogo size="md" href="/" priority />
          <div className="flex items-center gap-3">
            <Link
              href="/register"
              className="hidden sm:inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-3.5 py-1.5 text-sm font-semibold text-brand-navy hover:bg-slate-50 transition-colors"
            >
              Player Register
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primaryHover transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-6">
          <Activity className="w-3.5 h-3.5" /> Academy Performance Desk
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-navy max-w-3xl mx-auto leading-tight">
          Your Academy. <span className="text-brand-primary">Your Performance.</span> Your Future.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          The unified sports academy management platform. Replace notebook tracking with verified
          session attendance, linked match records, and dynamic trial readiness.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow hover:bg-brand-primaryHover transition-all gap-2"
          >
            Access Academy Desk <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-brand-navy hover:bg-slate-50 transition-all shadow-sm"
          >
            New Player Registration
          </Link>
        </div>
      </section>

      {/* Feature Pillars */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="rounded-xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center mb-5">
            <Users className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy mb-2">Practice Roster & Attendance</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Coaches snapshot active rosters by sport, record Present/Absent marks, and lock sessions
            atomically.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-5">
            <Trophy className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy mb-2">Verified Match Eligibility</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Only players marked Present in closed practice sessions are eligible for match entry.
            Scores are validated server-side.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-7 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-brand-navy mb-2">Dynamic Trial Readiness</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Derived on the fly (&ge;75% attendance and &ge;2 matches). Scouts see only verified
            Ready talent, protecting player privacy.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <SportSyncLogo size="sm" showTagline />
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SportSync. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
