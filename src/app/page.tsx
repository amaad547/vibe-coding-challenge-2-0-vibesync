import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Trophy,
  ArrowRight,
  Activity,
  LogIn,
  UserPlus,
  Eye,
} from "lucide-react";
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
              Player Registration
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-brand-primaryHover transition-colors gap-1.5"
            >
              <LogIn className="w-4 h-4" />
              Sign In
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-brand-primary text-xs font-semibold uppercase tracking-wider mb-6">
          <Activity className="w-3.5 h-3.5" /> Dumka Sports Academy Management Desk
        </div>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-brand-navy max-w-3xl mx-auto leading-tight">
          Your Academy. <span className="text-brand-primary">Your Performance.</span> Your Future.
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto">
          The verified sports academy management platform. Replace notebooks with locked attendance
          sessions, verified match fixtures, and objective trial readiness for talent scouting.
        </p>

        {/* Primary Clear Call to Actions */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg bg-brand-primary px-6 py-3 text-base font-semibold text-white shadow hover:bg-brand-primaryHover transition-all gap-2"
          >
            Sign In to Dashboard <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-semibold text-brand-navy hover:bg-slate-50 transition-all shadow-sm gap-2"
          >
            <UserPlus className="w-4 h-4 text-brand-primary" />
            Athlete Registration
          </Link>
        </div>
      </section>

      {/* 3 Dedicated Role Portals Overview */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-12">
        <div className="text-center mb-8">
          <h2 className="text-xl font-bold text-brand-navy">Choose Your Role to Enter</h2>
          <p className="text-xs text-slate-500 mt-1">
            SportSync provides role-tailored dashboards for coaches, athletes, and talent scouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coach Console Card */}
          <div className="rounded-xl border border-blue-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mb-4">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-brand-primary">
                Academy Coach
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Coach Desk</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Snapshot athlete rosters, record and lock attendance sessions, finalize match
                fixtures, and track real-time readiness.
              </p>
            </div>
            <Link
              href="/login?role=coach"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-blue-50 hover:bg-blue-100 py-2 text-xs font-bold text-brand-primary transition-colors"
            >
              Sign In as Coach <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Player Portal Card */}
          <div className="rounded-xl border border-indigo-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                Academy Athlete
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Player Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                View your personal verified attendance percentage, trial readiness milestone
                checklist, and match performance scores.
              </p>
            </div>
            <Link
              href="/login?role=player"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-indigo-50 hover:bg-indigo-100 py-2 text-xs font-bold text-indigo-600 transition-colors"
            >
              Sign In as Athlete <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Scout Registry Card */}
          <div className="rounded-xl border border-emerald-200/80 bg-white p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">
                Talent Scout
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Scout Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Discover verified trial-ready talent meeting the strict dual condition (≥ 75%
                attendance + ≥ 2 matches) with complete match score dossiers.
              </p>
            </div>
            <Link
              href="/login?role=scout"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-lg bg-emerald-50 hover:bg-emerald-100 py-2 text-xs font-bold text-emerald-600 transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              Sign In as Scout <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <SportSyncLogo size="sm" showTagline />
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Desk
          </p>
        </div>
      </footer>
    </main>
  );
}
