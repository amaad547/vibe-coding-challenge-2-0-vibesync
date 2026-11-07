"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  X,
  AlertTriangle,
  RefreshCw,
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

interface PlayerPortalData {
  player: {
    id: string;
    name: string;
    sport: string;
  };
  attendance: {
    heldSessions: number;
    presentSessions: number;
    absentSessions: number;
    percentage: number;
    isEligible: boolean;
  };
  readiness: {
    isReady: boolean;
  };
  sessions: Array<{
    id: string;
    date: string;
    sport: string;
    status: "PRESENT" | "ABSENT" | "UNMARKED";
  }>;
  matches: Array<unknown>;
}

export default function PlayerSessionsPage() {
  const router = useRouter();
  const [data, setData] = React.useState<PlayerPortalData | null>(null);
  const [sessionFilter, setSessionFilter] = React.useState<"ALL" | "PRESENT" | "ABSENT">("ALL");
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
        setError(json.error?.message || "Failed to load session history");
      }
    } catch {
      setError("Network error loading attendance sessions.");
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
        <LoadingOverlay message="Loading practice attendance logs..." />
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

        {/* Sessions Summary Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Attendance Percentage
            </span>
            <p className="text-3xl font-black text-brand-navy mt-2">
              {att ? att.percentage.toFixed(1) : "0.0"}%
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {att?.isEligible ? "≥ 75.0% Requirement Satisfied" : "Below 75.0% Threshold"}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Drills Attended
            </span>
            <p className="text-3xl font-black text-emerald-600 mt-2">
              {att?.presentSessions || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Marked PRESENT by coaching staff
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-2xs">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
              Sessions Absent
            </span>
            <p className="text-3xl font-black text-rose-600 mt-2">
              {att?.absentSessions || 0}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Out of {att?.heldSessions || 0} total closed drills
            </p>
          </div>
        </div>

        {/* Practice Sessions Attendance Table */}
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-lg sm:text-xl font-black text-brand-navy flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-brand-primary" />
                <span>Practice Sessions Attendance Log</span>
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Cryptographically locked practice sessions for {player?.sport.toUpperCase()} since enrollment
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSessionFilter("ALL")}
                  className={`px-3 py-1 rounded-md transition-all cursor-pointer ${
                    sessionFilter === "ALL"
                      ? "bg-white text-brand-navy shadow-2xs font-black"
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
                      ? "bg-emerald-600 text-white shadow-2xs font-black"
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
                      ? "bg-rose-600 text-white shadow-2xs font-black"
                      : "text-slate-500 hover:text-rose-700"
                  }`}
                >
                  Absent ({att?.absentSessions || 0})
                </button>
              </div>

              <Button variant="outline" size="sm" onClick={loadProfile} className="text-xs font-bold">
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
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
                      description="Sessions conducted by your coach will appear here once finalized."
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
      </main>
    </div>
  );
}

