import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Trophy,
  ArrowRight,
  Activity,
  UserPlus,
  Eye,
  Lock,
  Sparkles,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Clock,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { LandingNavbar } from "@/components/layout/landing-navbar";
import { getAcademyContact } from "@/lib/services/contact";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const contact = await getAcademyContact();

  return (
    <main className="relative min-h-screen flex flex-col justify-between bg-slate-50 text-brand-navy">
      {/* Ambient background glow orbs for landing page only */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 pointer-events-none overflow-hidden -z-10">
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute -top-20 right-1/4 w-96 h-96 bg-indigo-400/20 rounded-full blur-3xl animate-pulse-subtle" />
        <div className="absolute top-48 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-400/10 rounded-full blur-3xl" />
      </div>

      {/* Navigation Header with Frosted Glass - Sticky Responsive Navbar */}
      <LandingNavbar />

      {/* Hero Section */}
      <section className="relative max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-16 sm:pt-20 sm:pb-24 text-center">
        {/* Animated Academy Pill Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-card border border-blue-200/80 text-brand-primary text-xs font-bold uppercase tracking-wider mb-8 shadow-xs animate-float-slow">
          <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-ping" />
          <Activity className="w-3.5 h-3.5" />
          <span>Dumka Sports Academy Management Desk</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-brand-navy max-w-4xl mx-auto leading-[1.12]">
          Your Academy.{" "}
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 bg-clip-text text-transparent">
            Your Performance.
          </span>{" "}
          Your Future.
        </h1>

        <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed">
          The verified sports academy operating desk. Replace paper notebooks with cryptographically
          locked attendance sessions, verified match scorecards, and tamper-proof trial readiness
          for professional talent scouting.
        </p>

        {/* Primary Call to Action Buttons */}
        <div className="mt-8 flex flex-col sm:flex-row justify-center items-center gap-3.5">
          <Link
            href="/login"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-brand-primary px-7 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-500/25 hover:bg-brand-primaryHover hover:shadow-blue-500/40 transition-all duration-200 gap-2 hover:-translate-y-0.5"
          >
            Enter Dashboard Portal <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/register"
            className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl glass-card border border-slate-300/80 px-7 py-3.5 text-sm font-bold text-brand-navy hover:bg-white hover:border-slate-400 transition-all duration-200 shadow-xs gap-2 hover:-translate-y-0.5"
          >
            <UserPlus className="w-4 h-4 text-brand-primary" />
            Athlete Registration Desk
          </Link>
        </div>
      </section>

      {/* Metrics / Guarantee Bar with Glass Styling */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl glass-card border border-slate-200/80 shadow-md">
          <div className="text-center p-3">
            <p className="text-2xl sm:text-3xl font-black text-brand-primary">≥ 75%</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Attendance Threshold</p>
            <p className="text-[11px] text-slate-400">Exact unrounded ratio</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl sm:text-3xl font-black text-indigo-600">≥ 2</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Finalized Matches</p>
            <p className="text-[11px] text-slate-400">Real performance fixtures</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl sm:text-3xl font-black text-emerald-600">100%</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Locked Attendance</p>
            <p className="text-[11px] text-slate-400">Zero retroactive editing</p>
          </div>
          <div className="text-center p-3">
            <p className="text-2xl sm:text-3xl font-black text-amber-600">0 Bias</p>
            <p className="text-xs font-semibold text-slate-600 mt-1">Objective Scouting</p>
            <p className="text-[11px] text-slate-400">Strict server validation</p>
          </div>
        </div>
      </section>

      {/* Features Showcase */}
      <section id="features" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">
            Built for Integrity in Sports Development
          </h2>
          <p className="text-sm text-slate-600 mt-2">
            Every feature in SportSync is architected to eliminate manipulation and deliver
            verified, trustworthy performance records.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Feature 1 */}
          <div className="rounded-2xl glass-card p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 text-brand-primary flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">Immutable Attendance Locks</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              When a coach closes a practice session, attendance is locked permanently. No
              retroactive tampering is permitted via UI or API. Only closed sessions count towards
              readiness.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl glass-card p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">Server-Enforced Readiness</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Readiness is derived on every request: athletes must satisfy both the unrounded ≥ 75%
              attendance ratio and have participated in ≥ 2 finalized matches.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl glass-card p-6 border border-slate-200/80 shadow-sm hover:shadow-md transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-brand-navy">
              Instant Scout Privacy Revocation
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Scouts only ever see verified READY athletes. If an athlete drops below criteria,
              their dossier vanishes instantaneously from scout queries with strict server-side
              protection.
            </p>
          </div>
        </div>
      </section>

      {/* 4-Stage Operational Pipeline */}
      <section id="pipeline" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="rounded-3xl glass-card border border-slate-200/90 p-8 sm:p-12 shadow-lg">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-black uppercase tracking-wider text-brand-primary">
              Operational Pipeline
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-brand-navy mt-1">
              How Athletes Advance in SportSync
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
            {/* Step 1 */}
            <div className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-brand-primary text-xs font-black flex items-center justify-center">
                01
              </div>
              <h4 className="text-sm font-bold text-brand-navy">Registration</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Athlete submits details. Account enters pending verification queue for head coach
                approval.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-600 text-xs font-black flex items-center justify-center">
                02
              </div>
              <h4 className="text-sm font-bold text-brand-navy">Practice & Roll Call</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Coach opens session, marks PRESENT/ABSENT, and locks session. Attendance percentages
                update.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center">
                03
              </div>
              <h4 className="text-sm font-bold text-brand-navy">Match Fixtures</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Only athletes present in linked sessions are eligible. Scores recorded with
                sport-specific units.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative p-5 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-black flex items-center justify-center">
                04
              </div>
              <h4 className="text-sm font-bold text-brand-navy">Scout Discovery</h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                When conditions are met (≥75% + 2 matches), the athlete is unlocked in the scout
                dossier.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3 Dedicated Role Portals */}
      <section id="roles" className="max-w-6xl mx-auto px-4 sm:px-6 py-12 w-full">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">
            Choose Your Academy Portal
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            SportSync provides role-tailored dashboards for coaches, athletes, and talent scouts.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Coach Card */}
          <div className="group rounded-2xl glass-card border border-blue-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-brand-primary">
                Academy Coach
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Coach Desk</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Verify applicant registrations, create and lock practice sessions, record match
                scorecards, and monitor academy readiness metrics.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-blue-50 hover:bg-brand-primary hover:text-white py-2.5 text-xs font-bold text-brand-primary transition-all duration-200"
            >
              Sign In to Coach Desk <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {/* Player Card */}
          <div className="group rounded-2xl glass-card border border-indigo-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <Trophy className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-indigo-600">
                Academy Athlete
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Player Portal</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Track personal attendance %, view trial readiness qualification milestones, and
                inspect verified match performance scorecards.
              </p>
            </div>
            <div className="space-y-2">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-indigo-50 hover:bg-indigo-600 hover:text-white py-2.5 text-xs font-bold text-indigo-600 transition-all duration-200"
              >
                Sign In to Player Portal <ChevronRight className="w-3.5 h-3.5" />
              </Link>
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl border border-indigo-200 py-2 text-[11px] font-bold text-indigo-700 hover:bg-indigo-50/50 transition-colors"
              >
                New Athlete? Register Here
              </Link>
            </div>
          </div>

          {/* Scout Card */}
          <div className="group rounded-2xl glass-card border border-emerald-200/80 p-6 shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-600">
                Talent Scout
              </span>
              <h3 className="text-lg font-bold text-brand-navy mt-1 mb-2">Scout Registry</h3>
              <p className="text-xs text-slate-600 leading-relaxed mb-4">
                Discover verified trial-ready talent meeting strict dual conditions (≥75% attendance
                + ≥2 matches) with complete performance dossiers.
              </p>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-1.5 w-full rounded-xl bg-emerald-50 hover:bg-emerald-600 hover:text-white py-2.5 text-xs font-bold text-emerald-600 transition-all duration-200"
            >
              <Eye className="w-3.5 h-3.5" />
              Sign In to Scout Registry <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Details & Operations Desk Section */}
      <section id="contact" className="max-w-6xl mx-auto px-4 sm:px-6 py-14 w-full border-t border-slate-200/80">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-brand-primary text-xs font-bold uppercase tracking-wider mb-3">
            <Mail className="w-3.5 h-3.5" />
            <span>Official Academy Operations Desk</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-brand-navy">
            Contact Dumka Sports Academy
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-xl mx-auto">
            Get in touch with coaching staff, tournament coordinators, and talent scout liaisons.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Location */}
          <div className="rounded-2xl glass-card border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-brand-primary flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy mb-1">Academy Ground</h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {contact.academyAddress}
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-brand-primary">District Sports Authority</span>
            </div>
          </div>

          {/* Direct Line */}
          <div className="rounded-2xl glass-card border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <Phone className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy mb-1">Direct Helpline</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Helpline: <a href={`tel:${contact.phone.replace(/\s+/g, "")}`} className="text-brand-navy font-semibold hover:text-brand-primary">{contact.phone}</a><br />
                {contact.officePhone && (
                  <>
                    Office: <a href={`tel:${contact.officePhone.replace(/\s+/g, "")}`} className="text-brand-navy font-semibold hover:text-brand-primary">{contact.officePhone}</a><br />
                  </>
                )}
                Emergency: <span className="font-semibold text-slate-700">{contact.emergencyContact}</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-emerald-600">Mon &ndash; Sat &bull; Active Desk</span>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-2xl glass-card border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <Mail className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy mb-1">Email Inquiries</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                General: <a href="mailto:desk@dumkasports.org" className="text-brand-navy font-semibold hover:text-brand-primary">desk@dumkasports.org</a><br />
                Head Coach: <a href={`mailto:${contact.email}`} className="text-brand-navy font-semibold hover:text-brand-primary">{contact.email}</a><br />
                Coach Name: <span className="font-semibold text-slate-700">{contact.coachName}</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-indigo-600">Average response &lt; 24h</span>
            </div>
          </div>

          {/* Practice Hours */}
          <div className="rounded-2xl glass-card border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-brand-navy mb-1">Practice Hours</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Morning: <span className="font-semibold text-brand-navy">{contact.morningHours}</span><br />
                Evening: <span className="font-semibold text-brand-navy">{contact.eveningHours}</span><br />
                Sunday: <span className="font-semibold text-slate-700">Tournament Matches</span>
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100">
              <span className="text-[11px] font-semibold text-amber-600">6 Days / Week Training</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200/80 bg-white/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <SportSyncLogo size="sm" showTagline />
          <p className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Management Desk
          </p>
        </div>
      </footer>
    </main>
  );
}
