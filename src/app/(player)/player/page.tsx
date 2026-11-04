"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  CalendarCheck,
  Trophy,
  LogOut,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Check,
  X,
  Activity,
  Award,
  TrendingUp,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import { formatCalendarDate } from "@/lib/utils/date";

interface PlayerPortalData {
  player: {
    id: string;
    name: string;
    age: number;
    sport: string;
    isActive: boolean;
    registrationStatus: string;
    createdAt: string;
  };
  attendance: {
    heldSessions: number;
    presentSessions: number;
    absentSessions: number;
    rawRatio: number;
    percentage: number;
    isEligible: boolean;
  };
  readiness: {
    isReady: boolean;
    isAttendanceEligible: boolean;
    isMatchesEligible: boolean;
    matchesPlayed: number;
    reason: string;
  };
  sessions: Array<{
    id: string;
    date: string;
    sport: string;
    status: "PRESENT" | "ABSENT" | "UNMARKED";
  }>;
  matches: Array<{
    id: string;
    date: string;
    sport: string;
    opponent: string;
    myScore: number;
    scoreMetric: string;
    scoreUnit: string;
    totalAthletes: number;
  }>;
}

export default function PlayerPortalPage() {
  const router = useRouter();
  const [data, setData] = React.useState<PlayerPortalData | null>(null);
  const [activeTab, setActiveTab] = React.useState<"OVERVIEW" | "SESSIONS" | "MATCHES">("OVERVIEW");
  const [sessionFilter, setSessionFilter] = React.useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
  const [isLoading, setIsLoading] = React.useState(true);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(
    async (showRefreshIndicator = false) => {
      if (showRefreshIndicator) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);

      try {
        const res = await fetch("/api/player/me");
        if (res.status === 401 || res.status === 403) {
          router.push("/login");
          return;
        }
        const json = await res.json();
        if (json.data) {
          setData(json.data);
        } else {
          setError(json.error?.message || "Failed to load player data");
        }
      } catch {
        setError("Network error loading athlete portal. Please retry.");
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [router]
  );

  React.useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue to login
    }
    router.push("/login");
    router.refresh();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingOverlay message="Loading athlete performance record..." />
      </div>
    );
  }

  const player = data?.player;
  const att = data?.attendance;
  const ready = data?.readiness;
  const sessions = data?.sessions || [];
  const matches = data?.matches || [];

  const filteredSessions = sessions.filter((s) => {
    if (sessionFilter === "PRESENT") return s.status === "PRESENT";
    if (sessionFilter === "ABSENT") return s.status === "ABSENT";
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-brand-navy">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 bg-white/95 px-4 sm:px-8 py-3.5 backdrop-blur-md flex justify-between items-center shadow-xs">
        <SportSyncLogo size="sm" href="/player" />
        <div className="flex items-center gap-3">
          <Badge variant="info" dot className="font-semibold text-xs">
            Athlete Portal
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
            className="text-xs font-bold rounded-lg border-slate-200"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700 flex items-center gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Athlete Profile Banner */}
        <div className="relative rounded-2xl border border-blue-200/80 bg-gradient-to-r from-blue-50/90 via-white to-indigo-50/70 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="relative h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-tr from-brand-primary to-indigo-600 text-white flex items-center justify-center font-black text-2xl sm:text-3xl shadow-md ring-4 ring-white">
              {player?.name?.charAt(0) || "A"}
              {ready?.isReady && (
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 rounded-full bg-emerald-500 ring-2 ring-white items-center justify-center text-[10px] text-white">
                  ✓
                </span>
              )}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-navy tracking-tight">
                  {player?.name}
                </h1>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-blue-100/80 text-brand-primary border border-blue-200">
                  {player?.sport}
                </span>
                {ready?.isReady ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                    <Sparkles className="w-3 h-3 text-emerald-600" /> Scout Discoverable
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    In Training
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                <span>Dumka Sports Academy</span>
                <span>&bull;</span>
                <span>{player?.age} Years Old</span>
                <span>&bull;</span>
                <span>Enrolled: {player ? formatCalendarDate(player.createdAt) : "—"}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadProfile(true)}
              isLoading={isRefreshing}
              leftIcon={
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
              }
              className="text-xs font-bold rounded-xl border-slate-300 bg-white hover:bg-slate-50 shadow-2xs"
            >
              Sync Record
            </Button>
          </div>
        </div>

        {/* Readiness High-Impact Callout Banner */}
        {ready?.isReady ? (
          <div className="rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 via-emerald-100/40 to-teal-50 p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                <Trophy className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-emerald-950 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> TRIAL READY &bull; PROFILE
                  ACTIVE FOR SCOUTS
                </p>
                <p className="text-xs text-emerald-800 mt-0.5">
                  You satisfy the Dumka Academy dual readiness conditions (≥75% attendance + ≥2
                  matches). Professional talent scouts can view your performance dossier.
                </p>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-black shadow-xs">
                QUALIFIED
              </span>
            </div>
          </div>
        ) : (
          <div className="rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 via-amber-100/30 to-orange-50 p-5 shadow-xs flex items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-black text-amber-950 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-amber-600" /> TRIAL READINESS IN PROGRESS
                </p>
                <p className="text-xs text-amber-800 mt-0.5">{ready?.reason}</p>
              </div>
            </div>
            <div className="hidden md:block">
              <span className="px-3 py-1.5 rounded-xl bg-amber-100 text-amber-800 border border-amber-300 text-xs font-black">
                {ready?.isAttendanceEligible ? "1/2 MET" : "0/2 MET"}
              </span>
            </div>
          </div>
        )}

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Attendance Rate */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Attendance Rate
              </span>
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                <CalendarCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-navy">
                {att ? att.percentage.toFixed(1) : "0.0"}%
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    att?.isEligible ? "bg-emerald-500" : "bg-brand-primary"
                  }`}
                  style={{ width: `${Math.min(100, att?.percentage || 0)}%` }}
                />
              </div>
            </div>
            <div className="flex justify-between items-center text-xs text-slate-500 pt-1">
              <span>
                {att?.presentSessions || 0} / {att?.heldSessions || 0} sessions
              </span>
              <span
                className={`font-bold text-[11px] ${
                  att?.isEligible ? "text-emerald-600" : "text-amber-600"
                }`}
              >
                {att?.isEligible ? "≥ 75% Met" : "Target: 75%"}
              </span>
            </div>
          </div>

          {/* Practice Sessions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Sessions Held
              </span>
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-navy">{att?.heldSessions || 0}</p>
              <p className="text-xs text-slate-500 mt-1">Closed Practice Drills</p>
            </div>
            <div className="flex justify-between items-center text-xs pt-1">
              <span className="text-emerald-600 font-bold">
                {att?.presentSessions || 0} Present
              </span>
              <span className="text-rose-500 font-bold">{att?.absentSessions || 0} Absent</span>
            </div>
          </div>

          {/* Finalized Matches */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Matches Played
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                <Trophy className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-brand-navy">
                {ready?.matchesPlayed || 0}{" "}
                <span className="text-xs text-slate-400 font-normal">/ 2 req</span>
              </p>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    ready?.isMatchesEligible ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                  style={{
                    width: `${Math.min(100, ((ready?.matchesPlayed || 0) / 2) * 100)}%`,
                  }}
                />
              </div>
            </div>
            <div className="text-xs text-slate-500 pt-1">
              {ready?.isMatchesEligible ? (
                <span className="text-emerald-600 font-bold">Criteria Satisfied</span>
              ) : (
                <span className="text-amber-600">
                  {2 - (ready?.matchesPlayed || 0)} more match(es) required
                </span>
              )}
            </div>
          </div>

          {/* Scout Registry Status */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs hover:shadow-sm transition-all space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Scout Discovery
              </span>
              <div
                className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  ready?.isReady ? "bg-emerald-50 text-emerald-600" : "bg-slate-100 text-slate-400"
                }`}
              >
                <ShieldCheck className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p
                className={`text-xl font-black ${
                  ready?.isReady ? "text-emerald-700" : "text-slate-700"
                }`}
              >
                {ready?.isReady ? "VISIBLE" : "PRIVATE"}
              </p>
              <p className="text-xs text-slate-500 mt-1">Talent Dossier Access</p>
            </div>
            <div className="text-xs pt-1">
              <span
                className={`font-bold ${ready?.isReady ? "text-emerald-600" : "text-slate-500"}`}
              >
                {ready?.isReady ? "Live in Scout Registry" : "Locked until qualified"}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="flex flex-wrap gap-2 p-1.5 bg-slate-200/60 rounded-xl">
          <button
            type="button"
            onClick={() => setActiveTab("OVERVIEW")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "OVERVIEW"
                ? "bg-white text-brand-primary shadow-2xs"
                : "text-slate-600 hover:text-brand-navy hover:bg-white/50"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Trial Readiness & Overview</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("SESSIONS")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "SESSIONS"
                ? "bg-white text-brand-primary shadow-2xs"
                : "text-slate-600 hover:text-brand-navy hover:bg-white/50"
            }`}
          >
            <CalendarCheck className="w-3.5 h-3.5" />
            <span>Practice Attendance Log</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {sessions.length}
            </span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("MATCHES")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MATCHES"
                ? "bg-white text-brand-primary shadow-2xs"
                : "text-slate-600 hover:text-brand-navy hover:bg-white/50"
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Match Performances</span>
            <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-[10px] text-slate-600">
              {matches.length}
            </span>
          </button>
        </div>

        {/* TAB 1: OVERVIEW & READINESS */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Milestone Breakdown Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-navy">
                      Readiness Milestone Tracker
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Dumka Sports Academy Dual-Condition Rule
                    </p>
                  </div>
                </div>
                {ready?.isReady ? (
                  <Badge variant="success" dot className="font-bold">
                    Ready
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="font-semibold">
                    In Progress
                  </Badge>
                )}
              </div>

              {/* Condition 1 */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-brand-navy">
                    {ready?.isAttendanceEligible ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                    1. Practice Attendance Rate (≥ 75.0%)
                  </span>
                  <span
                    className={
                      ready?.isAttendanceEligible
                        ? "text-emerald-600 font-black"
                        : "text-amber-600 font-bold"
                    }
                  >
                    {att ? att.percentage.toFixed(1) : "0.0"}%
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ready?.isAttendanceEligible ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, att?.percentage || 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {ready?.isAttendanceEligible
                    ? "✓ Attendance requirement satisfied."
                    : `Attend closed practice sessions to reach 75.0% (currently ${att?.presentSessions || 0}/${att?.heldSessions || 0} sessions present).`}
                </p>
              </div>

              {/* Condition 2 */}
              <div className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/70 space-y-2.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-brand-navy">
                    {ready?.isMatchesEligible ? (
                      <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center">
                        <Check className="w-3 h-3" />
                      </span>
                    ) : (
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                        <X className="w-3 h-3" />
                      </span>
                    )}
                    2. Finalized Matches (≥ 2 Matches)
                  </span>
                  <span
                    className={
                      ready?.isMatchesEligible
                        ? "text-emerald-600 font-black"
                        : "text-amber-600 font-bold"
                    }
                  >
                    {ready?.matchesPlayed || 0} / 2
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      ready?.isMatchesEligible ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    style={{
                      width: `${Math.min(100, ((ready?.matchesPlayed || 0) / 2) * 100)}%`,
                    }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {ready?.isMatchesEligible
                    ? "✓ Match experience requirement satisfied."
                    : `You need ${2 - (ready?.matchesPlayed || 0)} more finalized match fixture appearance(s).`}
                </p>
              </div>

              {/* Objective Rule Note */}
              <div className="p-3.5 rounded-xl bg-blue-50/80 border border-blue-200 text-xs text-blue-900 leading-relaxed">
                <p className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-brand-primary" /> Academy Integrity Guarantee
                </p>
                <p className="mt-1 text-[11px]">
                  Readiness is calculated mathematically without subjective bias. The exact
                  unrounded ratio is evaluated on every query.
                </p>
              </div>
            </div>

            {/* Performance Summary / Advisory Card */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-2xs space-y-5 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-brand-navy">Athletic Standing</h3>
                    <p className="text-[11px] text-slate-500">
                      Discipline: {player?.sport.toUpperCase()}
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Registration Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
                      VERIFIED ATHLETE
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Total Practice Drills Attended:</span>
                    <span className="font-black text-brand-navy">
                      {att?.presentSessions || 0} sessions
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Match Participation Record:</span>
                    <span className="font-black text-brand-navy">
                      {ready?.matchesPlayed || 0} fixtures
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100">
                    <span className="text-slate-500">Scout Visibility:</span>
                    <span
                      className={`font-bold text-[11px] ${
                        ready?.isReady ? "text-emerald-700 font-black" : "text-slate-500"
                      }`}
                    >
                      {ready?.isReady ? "Active in Scout Registry" : "Private until Qualified"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 leading-relaxed">
                <p className="font-bold text-brand-navy">Coach Advisory Note:</p>
                <p className="mt-1 text-[11px] text-slate-500">
                  Only athletes marked PRESENT in the practice session on the match date are
                  eligible for match squad selection. Regular attendance is key to qualification.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PRACTICE SESSIONS HISTORY */}
        {activeTab === "SESSIONS" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-base font-black text-brand-navy">
                  Practice Sessions Attendance Log
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Locked practice sessions for {player?.sport.toUpperCase()} since enrollment
                </p>
              </div>

              {/* Status Filter Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSessionFilter("ALL")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    sessionFilter === "ALL"
                      ? "bg-white text-brand-navy shadow-2xs"
                      : "text-slate-500 hover:text-brand-navy"
                  }`}
                >
                  All ({sessions.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter("PRESENT")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    sessionFilter === "PRESENT"
                      ? "bg-emerald-600 text-white shadow-2xs"
                      : "text-slate-500 hover:text-emerald-700"
                  }`}
                >
                  Present ({att?.presentSessions || 0})
                </button>
                <button
                  type="button"
                  onClick={() => setSessionFilter("ABSENT")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    sessionFilter === "ABSENT"
                      ? "bg-rose-600 text-white shadow-2xs"
                      : "text-slate-500 hover:text-rose-700"
                  }`}
                >
                  Absent ({att?.absentSessions || 0})
                </button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Practice Date</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Session ID</TableHead>
                  <TableHead className="text-right">Attendance Record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSessions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4}>
                      <TableEmpty
                        message="No practice sessions match this filter"
                        description="Sessions conducted by your coach will appear here once locked."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSessions.map((s) => (
                    <TableRow key={s.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-bold text-xs text-brand-navy">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatCalendarDate(s.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {s.sport}
                        </span>
                      </TableCell>
                      <TableCell className="font-mono text-[11px] text-slate-400">
                        {s.id.slice(-8)}
                      </TableCell>
                      <TableCell className="text-right">
                        {s.status === "PRESENT" ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> PRESENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                            <X className="w-3.5 h-3.5 text-rose-600" /> ABSENT
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* TAB 3: MATCH FIXTURES */}
        {activeTab === "MATCHES" && (
          <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
            <div className="p-5 sm:p-6 border-b border-slate-100">
              <h3 className="text-base font-black text-brand-navy">
                Match Performances & Individual Score Ledger
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Finalized match fixtures with official sport-derived metric units
              </p>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fixture Date</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Individual Score</TableHead>
                  <TableHead className="text-right">Squad Roster</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <TableEmpty
                        message="No finalized match fixtures recorded yet"
                        description="Participate in practice sessions to become eligible for upcoming match sheets."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  matches.map((m) => (
                    <TableRow key={m.id} className="hover:bg-slate-50/70">
                      <TableCell className="font-bold text-xs text-brand-navy">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {formatCalendarDate(m.date)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {m.sport}
                        </span>
                      </TableCell>
                      <TableCell className="font-bold text-xs text-brand-navy">
                        vs. {m.opponent}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-brand-primary text-xs font-black">
                          {m.myScore} {m.scoreUnit}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-xs font-semibold text-slate-500">
                        {m.totalAthletes} Athletes
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-400">
        &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Management Desk
      </footer>
    </div>
  );
}
