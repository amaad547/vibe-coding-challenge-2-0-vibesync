"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { PlayerNavbar } from "@/components/layout/player-navbar";
import { Button } from "@/components/ui/button";
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
import { formatSkillLabel } from "@/lib/constants/skills";

interface MatchItem {
  id: string;
  date: string;
  sport: string;
  opponent: string;
  myScore: number;
  scoreMetric: string;
  scoreUnit: string;
  playerRoleSnapshot?: string;
  stats?: Record<string, unknown>;
  formattedSummary?: string;
  totalAthletes: number;
}

interface PlayerPortalData {
  player: {
    id: string;
    name: string;
    sport: string;
  };
  attendance: {
    heldSessions: number;
    presentSessions: number;
  };
  readiness: {
    isReady: boolean;
    isMatchesEligible: boolean;
    matchesPlayed: number;
  };
  sessions: Array<unknown>;
  matches: Array<MatchItem>;
}

export default function PlayerMatchesPage() {
  const router = useRouter();
  const [data, setData] = React.useState<PlayerPortalData | null>(null);
  const [activitiesCount, setActivitiesCount] = React.useState<number>(0);
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
        setError(json.error?.message || "Failed to load match ledger");
      }
    } catch {
      setError("Network error loading matches record.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadProfile();
    fetch("/api/activities?upcoming=true")
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json?.data?.activities) {
          setActivitiesCount(json.data.activities.length);
        }
      })
      .catch(() => {});
  }, [loadProfile]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingOverlay message="Loading match performance ledger..." />
      </div>
    );
  }

  const player = data?.player;
  const ready = data?.readiness;
  const sessions = data?.sessions || [];
  const matches = data?.matches || [];

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-brand-navy dark:text-[#F8FAFC]">
      <PlayerNavbar
        player={player}
        isReady={ready?.isReady}
        activitiesCount={activitiesCount}
        sessionsCount={sessions.length}
        matchesCount={matches.length}
      />

      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {error && (
          <div className="rounded-xl bg-rose-50 border border-rose-200 p-4 text-xs font-medium text-rose-700 flex items-center gap-2.5 shadow-2xs">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Match Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Matches Played
              </span>
              <Trophy className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-brand-navy mt-2">
              {ready?.matchesPlayed || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Minimum 2 finalized fixtures required for readiness
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Match Readiness
              </span>
              <ShieldCheck className="w-4 h-4 text-blue-500" />
            </div>
            <p className={`text-2xl font-black mt-2 ${ready?.isMatchesEligible ? "text-emerald-600" : "text-amber-600"}`}>
              {ready?.isMatchesEligible ? "QUALIFIED (≥ 2)" : `${2 - (ready?.matchesPlayed || 0)} More Needed`}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {ready?.isMatchesEligible ? "Dual-condition criterion met" : "Awaiting squad participation"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                Scout Visibility
              </span>
              <Sparkles className="w-4 h-4 text-indigo-500" />
            </div>
            <p className={`text-2xl font-black mt-2 ${ready?.isReady ? "text-emerald-600" : "text-slate-500"}`}>
              {ready?.isReady ? "LIVE IN REGISTRY" : "LOCKED"}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {ready?.isReady ? "Scouts can access your score records" : "Requires ≥75% attendance + ≥2 matches"}
            </p>
          </div>
        </div>

        {/* Match Performances Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-brand-navy flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <span>Match Performances & Individual Score Ledger</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Official finalized match fixtures with sport-derived score metrics for {player?.sport.toUpperCase()}
              </p>
            </div>

            <Button variant="outline" size="sm" onClick={loadProfile} className="text-xs font-bold">
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Refresh
            </Button>
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
                      description="Participate in practice sessions to become eligible for upcoming match fixture squad selection."
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
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200 text-brand-primary text-xs font-black">
                          {m.formattedSummary || `${m.myScore} ${m.scoreUnit}`}
                        </span>
                        {m.playerRoleSnapshot && (
                          <span className="text-[10px] text-slate-400 block mt-0.5 font-medium">
                            {formatSkillLabel(m.playerRoleSnapshot)}
                          </span>
                        )}
                      </div>
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
      </main>
    </div>
  );
}

