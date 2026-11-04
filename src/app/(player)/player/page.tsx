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
    await fetch("/api/auth/logout", { method: "POST" });
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
        <div className="rounded-2xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-brand-primary text-white flex items-center justify-center font-black text-2xl shadow-sm">
              {player?.name?.charAt(0) || "A"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black text-brand-navy">{player?.name}</h1>
                <Badge variant="neutral" className="uppercase font-semibold">
                  {player?.sport}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Dumka Sports Academy &bull; {player?.age} Years Old &bull; Enrolled:{" "}
                {player ? formatCalendarDate(player.createdAt) : "—"}
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadProfile}
            leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Refresh
          </Button>
        </div>

        {/* Dual Primary KPI Cards: Attendance & Trial Readiness */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Attendance KPI */}
          <Card className="border-l-4 border-l-brand-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-bold text-slate-500">
                  Practice Attendance Record
                </CardDescription>
                <CalendarCheck className="w-5 h-5 text-brand-primary" />
              </div>
              <div className="flex items-baseline gap-2 mt-1">
                <CardTitle className="text-3xl font-black text-brand-navy">
                  {att ? att.percentage.toFixed(1) : "0.0"}%
                </CardTitle>
                <span className="text-xs text-slate-500 font-semibold">
                  ({att?.presentSessions || 0} of {att?.heldSessions || 0} Sessions Present)
                </span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Visual Progress Bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Attendance Target</span>
                  <span
                    className={`font-bold ${
                      att?.isEligible ? "text-emerald-600" : "text-amber-600"
                    }`}
                  >
                    {att?.isEligible ? "Target Satisfied (≥ 75%)" : "Below 75% Requirement"}
                  </span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      att?.isEligible ? "bg-emerald-500" : "bg-amber-400"
                    }`}
                    style={{ width: `${Math.min(100, att?.percentage || 0)}%` }}
                  />
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                Calculated strictly from closed practice sessions for your sport since enrollment.
              </p>
            </CardContent>
          </Card>

          {/* Trial Readiness KPI */}
          <Card
            className={`border-l-4 ${
              ready?.isReady ? "border-l-emerald-500 bg-emerald-50/15" : "border-l-amber-500"
            }`}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-bold text-slate-500">
                  Trial Readiness Status
                </CardDescription>
                <ShieldCheck
                  className={`w-5 h-5 ${ready?.isReady ? "text-emerald-600" : "text-amber-500"}`}
                />
              </div>
              <div className="flex items-center gap-2 mt-1">
                {ready?.isReady ? (
                  <Badge variant="success" dot className="text-xs py-1 px-3">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1 inline" /> READY FOR SCOUTING
                  </Badge>
                ) : (
                  <Badge variant="neutral" className="text-xs py-1 px-3">
                    IN PROGRESS / NOT READY
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs text-slate-700 font-medium">{ready?.reason}</p>

              {/* Dual Milestones Breakdown */}
              <div className="grid grid-cols-2 gap-2 pt-2 text-xs border-t border-slate-100">
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    1. Attendance (≥ 75%)
                  </span>
                  <strong
                    className={ready?.isAttendanceEligible ? "text-emerald-600" : "text-amber-600"}
                  >
                    {ready?.isAttendanceEligible ? "Passed" : "Incomplete"}
                  </strong>
                </div>
                <div className="p-2 rounded bg-slate-50">
                  <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                    2. Matches Played (≥ 2)
                  </span>
                  <strong
                    className={ready?.isMatchesEligible ? "text-emerald-600" : "text-amber-600"}
                  >
                    {ready?.matchesPlayed || 0} / 2 Matches
                  </strong>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Match Fixture History */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-primary" />
              My Match Performance History
            </CardTitle>
            <CardDescription>
              Official finalized match fixtures you participated in, with your verified individual
              scores.
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
                  <TableHead className="text-right">Athletes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {matches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5}>
                      <TableEmpty
                        message="No finalized match records yet"
                        description="Participate in practice sessions and team matches to record match experience."
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
                        {m.totalAthletes} Total
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
