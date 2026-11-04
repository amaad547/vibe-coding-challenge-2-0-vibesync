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
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadProfile = React.useCallback(async () => {
    setIsLoading(true);
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
      setError("Network error loading player portal.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

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
      <div className="min-h-screen flex items-center justify-center bg-brand-surface">
        <LoadingOverlay message="Loading athlete performance record..." />
      </div>
    );
  }

  const player = data?.player;
  const att = data?.attendance;
  const ready = data?.readiness;
  const sessions = data?.sessions || [];
  const matches = data?.matches || [];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface">
      {/* Top Navigation */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3 backdrop-blur-sm flex justify-between items-center shadow-xs">
        <SportSyncLogo size="sm" href="/player" />
        <div className="flex items-center gap-3">
          <Badge variant="info" dot>
            Athlete Portal
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Athlete Banner */}
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 via-white to-blue-50/40 p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-black text-2xl shadow-sm ring-4 ring-blue-100">
              {player?.name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-brand-navy">{player?.name}</h1>
                <Badge variant="neutral" className="uppercase font-semibold">
                  {player?.sport}
                </Badge>
                {ready?.isReady && (
                  <Badge variant="success" dot>
                    Ready for Scouts
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Dumka Sports Academy &bull; {player?.age} Years Old &bull; Enrolled:{" "}
                {player ? formatCalendarDate(player.createdAt) : "—"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={loadProfile}
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* 4 Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Attendance Rate */}
          <Card className="border-l-4 border-l-brand-primary">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Attendance Rate
                </CardDescription>
                <CalendarCheck className="w-4 h-4 text-brand-primary" />
              </div>
              <CardTitle className="text-2xl font-black text-brand-navy">
                {att ? att.percentage.toFixed(1) : "0.0"}%
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>
                  {att?.presentSessions || 0} / {att?.heldSessions || 0} Present
                </span>
                <span className={att?.isEligible ? "text-emerald-600 font-bold" : "text-amber-600"}>
                  {att?.isEligible ? "≥ 75% Met" : "Target: 75%"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Practice Sessions */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Sessions Held
                </CardDescription>
                <Activity className="w-4 h-4 text-blue-500" />
              </div>
              <CardTitle className="text-2xl font-black text-brand-navy">
                {att?.heldSessions || 0}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">{att?.absentSessions || 0} absent session(s)</p>
            </CardContent>
          </Card>

          {/* Finalized Matches */}
          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Matches Played
                </CardDescription>
                <Trophy className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-2xl font-black text-brand-navy">
                {ready?.matchesPlayed || 0}{" "}
                <span className="text-xs text-slate-400 font-normal">/ 2 req</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                {ready?.isMatchesEligible ? "Criteria satisfied" : "Needs 2 finalized matches"}
              </p>
            </CardContent>
          </Card>

          {/* Trial Readiness Verdict */}
          <Card
            className={`border-l-4 ${
              ready?.isReady ? "border-l-emerald-500 bg-emerald-50/20" : "border-l-slate-400"
            }`}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Scout Readiness
                </CardDescription>
                <ShieldCheck
                  className={`w-4 h-4 ${ready?.isReady ? "text-emerald-600" : "text-slate-400"}`}
                />
              </div>
              <CardTitle
                className={`text-base font-extrabold ${
                  ready?.isReady ? "text-emerald-700" : "text-slate-700"
                }`}
              >
                {ready?.isReady ? "READY" : "IN PROGRESS"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500 truncate">
                {ready?.isReady ? "Visible to Talent Scouts" : "Working on criteria"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200">
          <nav className="flex space-x-6 text-sm font-semibold" aria-label="Tabs">
            <button
              type="button"
              onClick={() => setActiveTab("OVERVIEW")}
              className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "OVERVIEW"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Trial Readiness & Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("SESSIONS")}
              className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "SESSIONS"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              Practice Sessions ({sessions.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MATCHES")}
              className={`pb-3 px-1 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
                activeTab === "MATCHES"
                  ? "border-brand-primary text-brand-primary"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              <Trophy className="w-4 h-4" />
              Match Fixtures ({matches.length})
            </button>
          </nav>
        </div>

        {/* TAB 1: OVERVIEW & READINESS */}
        {activeTab === "OVERVIEW" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Readiness Evaluation Card */}
            <Card className="border-2 border-slate-200/70">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-brand-primary" />
                    Trial Readiness Milestone Tracker
                  </CardTitle>
                  {ready?.isReady ? (
                    <Badge variant="success" dot>
                      Ready for Scouts
                    </Badge>
                  ) : (
                    <Badge variant="neutral">In Progress</Badge>
                  )}
                </div>
                <CardDescription>
                  Dumka Sports Academy trial readiness policy requires satisfying both conditions.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Condition 1: Attendance */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      {ready?.isAttendanceEligible ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-amber-500" />
                      )}
                      1. Practice Attendance Rate (≥ 75.0%)
                    </span>
                    <span
                      className={
                        ready?.isAttendanceEligible ? "text-emerald-600" : "text-amber-600"
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
                  <p className="text-[11px] text-slate-500">
                    {ready?.isAttendanceEligible
                      ? "Attendance threshold satisfied."
                      : `Attend more practice sessions to reach 75.0% (current: ${att?.presentSessions || 0}/${att?.heldSessions || 0} sessions).`}
                  </p>
                </div>

                {/* Condition 2: Matches */}
                <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="text-slate-700 flex items-center gap-1.5">
                      {ready?.isMatchesEligible ? (
                        <Check className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <X className="w-4 h-4 text-amber-500" />
                      )}
                      2. Finalized Matches (≥ 2 Matches)
                    </span>
                    <span
                      className={ready?.isMatchesEligible ? "text-emerald-600" : "text-amber-600"}
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
                  <p className="text-[11px] text-slate-500">
                    {ready?.isMatchesEligible
                      ? "Match experience requirement met."
                      : `You need ${2 - (ready?.matchesPlayed || 0)} more match fixture participation.`}
                  </p>
                </div>

                {/* Overall Verdict Box */}
                <div
                  className={`p-3 rounded-xl border text-xs ${
                    ready?.isReady
                      ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                      : "bg-amber-50 border-amber-200 text-amber-900"
                  }`}
                >
                  <p className="font-bold">Academy Status Verdict:</p>
                  <p className="mt-0.5">{ready?.reason}</p>
                </div>
              </CardContent>
            </Card>

            {/* Performance Summary / Coach Advisory Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-500" />
                  Performance Highlights
                </CardTitle>
                <CardDescription>
                  Your current records in {player?.sport.toUpperCase()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 text-xs">
                <div className="space-y-2">
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Enrolled Academy Sport:</span>
                    <strong className="text-brand-navy uppercase font-bold">{player?.sport}</strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Total Practice Sessions Present:</span>
                    <strong className="text-brand-navy font-bold">
                      {att?.presentSessions || 0}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Total Match Fixtures Played:</span>
                    <strong className="text-brand-navy font-bold">
                      {ready?.matchesPlayed || 0}
                    </strong>
                  </div>
                  <div className="flex justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="text-slate-500">Scout Visibility:</span>
                    <strong
                      className={ready?.isReady ? "text-emerald-600 font-bold" : "text-slate-500"}
                    >
                      {ready?.isReady ? "Active in Scout Registry" : "Private until Ready"}
                    </strong>
                  </div>
                </div>

                <div className="p-3 rounded-lg border border-blue-200 bg-blue-50/60 text-blue-900">
                  <p className="font-bold">Coach Advisory:</p>
                  <p className="mt-0.5">
                    Practice sessions held for your sport calculate your attendance rate
                    automatically. Keep attending practice regularly so you remain eligible for
                    upcoming match sheets.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* TAB 2: PRACTICE SESSIONS HISTORY */}
        {activeTab === "SESSIONS" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Practice Sessions Attendance Log</CardTitle>
              <CardDescription>
                Closed practice sessions for {player?.sport.toUpperCase()} since your enrollment
                date.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead className="text-right">My Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3}>
                        <TableEmpty
                          message="No practice sessions recorded yet"
                          description="Your coach will open practice sessions for your sport."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    sessions.map((s) => (
                      <TableRow key={s.id}>
                        <TableCell className="font-semibold text-xs text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatCalendarDate(s.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="uppercase text-[10px]">
                            {s.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {s.status === "PRESENT" ? (
                            <Badge variant="success">
                              <CheckCircle2 className="w-3 h-3 mr-1 inline" /> PRESENT
                            </Badge>
                          ) : (
                            <Badge variant="danger">ABSENT</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* TAB 3: MATCH FIXTURES */}
        {activeTab === "MATCHES" && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Match Performances & Individual Scores</CardTitle>
              <CardDescription>
                Finalized match fixtures you participated in with server-verified score records.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Opponent</TableHead>
                    <TableHead>My Performance</TableHead>
                    <TableHead className="text-right">Total Squad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <TableEmpty
                          message="No finalized match fixtures yet"
                          description="Attend practice sessions to become eligible for upcoming matches."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    matches.map((m) => (
                      <TableRow key={m.id} className="hover:bg-slate-50/70">
                        <TableCell className="font-semibold text-xs text-slate-800">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatCalendarDate(m.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="uppercase text-[10px]">
                            {m.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-xs text-brand-navy">
                          vs. {m.opponent}
                        </TableCell>
                        <TableCell>
                          <span className="text-xs font-extrabold text-brand-primary">
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
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
