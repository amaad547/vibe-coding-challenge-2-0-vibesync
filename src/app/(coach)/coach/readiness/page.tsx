"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableEmpty,
} from "@/components/ui/table";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Trophy,
  CalendarCheck,
  Sparkles,
} from "lucide-react";

interface PlayerReadinessItem {
  playerId: string;
  playerName: string;
  age: number;
  sport: string;
  heldSessions: number;
  presentSessions: number;
  absentSessions: number;
  rawAttendanceRatio: number;
  attendancePercentage: number;
  matchesPlayed: number;
  isAttendanceEligible: boolean;
  isMatchesEligible: boolean;
  isReady: boolean;
  readinessReason: string;
}

export default function CoachReadinessPage() {
  const router = useRouter();

  const [players, setPlayers] = React.useState<PlayerReadinessItem[]>([]);
  const [sportFilter, setSportFilter] = React.useState("");
  const [readinessFilter, setReadinessFilter] = React.useState<"ALL" | "READY" | "NOT_READY">(
    "ALL"
  );
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const fetchReadiness = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sportFilter) params.set("sport", sportFilter);

      const res = await fetch(`/api/readiness?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data?.players) {
        setPlayers(json.data.players);
      }
    } catch {
      setError("Failed to calculate player readiness. Please check server connection.");
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, router]);

  React.useEffect(() => {
    fetchReadiness();
  }, [fetchReadiness]);

  // Filtered subset
  const filteredPlayers = players.filter((p) => {
    if (readinessFilter === "READY" && !p.isReady) return false;
    if (readinessFilter === "NOT_READY" && p.isReady) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return p.playerName.toLowerCase().includes(q) || p.sport.toLowerCase().includes(q);
    }
    return true;
  });

  const totalReady = players.filter((p) => p.isReady).length;
  const totalNotReady = players.length - totalReady;

  return (
    <AppShell role="COACH">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
                Player Readiness Engine
              </h1>
              <Badge variant="info">Phase 6 Engine</Badge>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Dynamic evaluation of athlete trial readiness. Athletes must satisfy{" "}
              <strong>&ge; 75.0% Attendance</strong> and <strong>&ge; 2 Finalized Matches</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReadiness}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Recalculate
            </Button>
          </div>
        </div>

        {/* Overview Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-emerald-500 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Ready for Scouts
                </CardDescription>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-emerald-600">
                {totalReady}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                Athletes meeting all trial criteria (&ge; 75% attendance + &ge; 2 matches)
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Developing / In Progress
                </CardDescription>
                <AlertCircle className="w-4 h-4 text-amber-500" />
              </div>
              <CardTitle className="text-3xl font-extrabold text-amber-600">
                {totalNotReady}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">
                Athletes working towards trial readiness milestones
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-brand-primary bg-white">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                  Readiness Rule Formula
                </CardDescription>
                <ShieldCheck className="w-4 h-4 text-brand-primary" />
              </div>
              <CardTitle className="text-base font-bold text-brand-navy">
                Strict Dual Condition
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CalendarCheck className="w-3.5 h-3.5 text-brand-primary" />
                <span>Attendance Ratio &ge; 0.75 (75.0%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Trophy className="w-3.5 h-3.5 text-brand-primary" />
                <span>Finalized Matches &ge; 2</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-72">
                <Input
                  placeholder="Search athlete by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                {/* Readiness Status Filter */}
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => setReadinessFilter("ALL")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      readinessFilter === "ALL"
                        ? "bg-white text-brand-navy shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    All ({players.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadinessFilter("READY")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      readinessFilter === "READY"
                        ? "bg-white text-emerald-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Ready ({totalReady})
                  </button>
                  <button
                    type="button"
                    onClick={() => setReadinessFilter("NOT_READY")}
                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors ${
                      readinessFilter === "NOT_READY"
                        ? "bg-white text-amber-600 shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Not Ready ({totalNotReady})
                  </button>
                </div>

                {/* Sport Filter */}
                <select
                  value={sportFilter}
                  onChange={(e) => setSportFilter(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">All Sports</option>
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="athletics">Athletics</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Readiness Evaluation Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Athlete Readiness Ledger</CardTitle>
            <CardDescription>
              Calculated real-time from immutable closed practice sessions and finalized match
              records.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Attendance Ratio</TableHead>
                  <TableHead>Attendance Rate</TableHead>
                  <TableHead>Matches Played</TableHead>
                  <TableHead>Trial Readiness</TableHead>
                  <TableHead>Readiness Analysis</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                      Evaluating live athlete readiness...
                    </TableCell>
                  </TableRow>
                ) : filteredPlayers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <TableEmpty
                        message="No athlete records found"
                        description={
                          sportFilter || searchQuery || readinessFilter !== "ALL"
                            ? "No athletes match the selected filter criteria."
                            : "No verified athletes enrolled in the academy."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPlayers.map((player) => (
                    <TableRow key={player.playerId} className="hover:bg-slate-50/70">
                      {/* Athlete */}
                      <TableCell>
                        <div className="font-semibold text-slate-900">{player.playerName}</div>
                        <div className="text-xs text-slate-500">{player.age} yrs</div>
                      </TableCell>

                      {/* Sport */}
                      <TableCell>
                        <Badge variant="neutral" className="uppercase font-semibold">
                          {player.sport}
                        </Badge>
                      </TableCell>

                      {/* Sessions Ratio */}
                      <TableCell>
                        <div className="text-xs font-semibold text-slate-700">
                          <strong className="text-brand-navy">{player.presentSessions}</strong> /{" "}
                          <span className="text-slate-500">{player.heldSessions}</span> Present
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {player.heldSessions === 0
                            ? "No eligible sessions"
                            : "Closed sessions held"}
                        </div>
                      </TableCell>

                      {/* Percentage & Progress Bar */}
                      <TableCell>
                        <div className="w-28 space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span
                              className={`font-bold ${
                                player.isAttendanceEligible ? "text-emerald-600" : "text-amber-600"
                              }`}
                            >
                              {player.attendancePercentage.toFixed(1)}%
                            </span>
                            <span className="text-[10px] text-slate-400">req 75%</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all duration-300 ${
                                player.isAttendanceEligible ? "bg-emerald-500" : "bg-amber-400"
                              }`}
                              style={{
                                width: `${Math.min(100, player.attendancePercentage)}%`,
                              }}
                            />
                          </div>
                        </div>
                      </TableCell>

                      {/* Matches */}
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <Trophy
                            className={`w-4 h-4 ${
                              player.isMatchesEligible ? "text-emerald-500" : "text-slate-400"
                            }`}
                          />
                          <span
                            className={`text-sm font-bold ${
                              player.isMatchesEligible ? "text-brand-navy" : "text-slate-500"
                            }`}
                          >
                            {player.matchesPlayed}
                          </span>
                          <span className="text-xs text-slate-400">/ 2 req</span>
                        </div>
                      </TableCell>

                      {/* Readiness Badge */}
                      <TableCell>
                        {player.isReady ? (
                          <Badge variant="success" dot>
                            <CheckCircle2 className="w-3 h-3 mr-1 inline" /> READY
                          </Badge>
                        ) : (
                          <Badge variant="neutral">NOT READY</Badge>
                        )}
                      </TableCell>

                      {/* Analysis Details */}
                      <TableCell>
                        <span
                          className={`text-xs ${
                            player.isReady ? "text-emerald-700 font-medium" : "text-slate-500"
                          }`}
                        >
                          {player.readinessReason}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
