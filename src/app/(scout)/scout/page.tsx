"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  LogOut,
  Award,
  AlertCircle,
  Eye,
  RefreshCw,
  Trophy,
  AlertTriangle,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
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

interface ReadyAthleteSummary {
  id: string;
  name: string;
  age: number;
  sport: string;
  attendancePercentage: number;
  heldSessions: number;
  presentSessions: number;
  matchesPlayed: number;
  isReady: boolean;
}

interface ScoutingDossier {
  player: {
    id: string;
    name: string;
    age: number;
    sport: string;
    enrolledAt: string;
  };
  readinessEvidence: {
    attendancePercentage: number;
    heldSessions: number;
    presentSessions: number;
    absentSessions: number;
    matchesPlayed: number;
    isReady: boolean;
  };
  matchHistory: Array<{
    id: string;
    date: string;
    sport: string;
    opponent: string;
    score: number;
    scoreMetric: string;
    scoreUnit: string;
  }>;
}

export default function ScoutRegistryPage() {
  const router = useRouter();

  // Ready List State
  const [players, setPlayers] = React.useState<ReadyAthleteSummary[]>([]);
  const [search, setSearch] = React.useState("");
  const [sportFilter, setSportFilter] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [totalCount, setTotalCount] = React.useState(0);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Selected Dossier State
  const [selectedPlayerId, setSelectedPlayerId] = React.useState<string | null>(null);
  const [dossier, setDossier] = React.useState<ScoutingDossier | null>(null);
  const [isLoadingDossier, setIsLoadingDossier] = React.useState(false);
  const [dossierError, setDossierError] = React.useState<string | null>(null);

  const fetchReadyPlayers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (sportFilter) params.set("sport", sportFilter);
      params.set("page", page.toString());
      params.set("limit", "10");

      const res = await fetch(`/api/scout/ready-players?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data) {
        setPlayers(json.data.players);
        setTotalPages(json.data.pagination.totalPages);
        setTotalCount(json.data.pagination.total);
      }
    } catch {
      setError("Failed to load scouting registry. Please check network connection.");
    } finally {
      setIsLoading(false);
    }
  }, [search, sportFilter, page, router]);

  React.useEffect(() => {
    fetchReadyPlayers();
  }, [fetchReadyPlayers]);

  const handleOpenDossier = async (playerId: string) => {
    setSelectedPlayerId(playerId);
    setDossier(null);
    setDossierError(null);
    setIsLoadingDossier(true);

    try {
      const res = await fetch(`/api/scout/ready-players/${playerId}`);
      const json = await res.json();

      if (!res.ok) {
        setDossierError(
          json.error?.message ||
            "This athlete is no longer evaluated as Ready. Scout access has been removed."
        );
        // Refresh registry in case player became unready
        await fetchReadyPlayers();
      } else if (json.data) {
        setDossier(json.data);
      }
    } catch {
      setDossierError("Network error loading scouting dossier.");
    } finally {
      setIsLoadingDossier(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-brand-surface">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 px-4 sm:px-8 py-3 backdrop-blur-sm flex justify-between items-center shadow-xs">
        <SportSyncLogo size="sm" href="/scout" />
        <div className="flex items-center gap-3">
          <Badge variant="success" dot>
            Scout Verified Desk
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

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Scout Header Banner */}
        <div className="rounded-2xl border border-emerald-100 bg-linear-to-r from-emerald-50 to-white p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-brand-navy">Scout Talent Registry</h1>
              <p className="text-xs text-slate-500">
                Dumka Sports Academy &bull; Authorized Talent Discovery & Scouting
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchReadyPlayers}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Refresh
          </Button>
        </div>

        {/* Privacy Invariant Notice */}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-brand-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-bold">Strict Server-Enforced Ready Access Policy</p>
            <p>
              Scouts can discover and view profiles of <strong>Trial-Ready athletes only</strong>{" "}
              (attendance &ge; 75% and &ge; 2 finalized matches). If an athlete&apos;s attendance
              drops or criteria change, their profile is automatically removed from this registry in
              real time.
            </p>
          </div>
        </div>

        {/* Talent Filter & Table Card */}
        <Card>
          <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Award className="w-5 h-5 text-emerald-600" />
                Verified Ready Athletes ({totalCount})
              </CardTitle>
              <CardDescription>
                Athletes meeting all objective criteria for trial evaluation.
              </CardDescription>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="w-full sm:w-56">
                <Input
                  placeholder="Search athlete by name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  leftIcon={<Search className="h-4 w-4 text-slate-400" />}
                />
              </div>

              <select
                value={sportFilter}
                onChange={(e) => {
                  setSportFilter(e.target.value);
                  setPage(1);
                }}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-brand-primary focus:outline-hidden"
              >
                <option value="">All Sports</option>
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="basketball">Basketball</option>
                <option value="athletics">Athletics</option>
                <option value="badminton">Badminton</option>
              </select>
            </div>
          </CardHeader>

          <CardContent>
            {error && (
              <div className="mb-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Athlete</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Verified Attendance</TableHead>
                  <TableHead>Matches Played</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                      Loading verified talent pool...
                    </TableCell>
                  </TableRow>
                ) : players.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <TableEmpty
                        message="No ready athletes currently in pool"
                        description={
                          sportFilter || search
                            ? "No ready athletes match the selected filter query."
                            : "No athletes currently satisfy the trial readiness criteria (75% attendance + 2 matches)."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  players.map((p) => (
                    <TableRow key={p.id} className="hover:bg-slate-50/70">
                      <TableCell>
                        <div className="font-bold text-slate-900 text-xs">{p.name}</div>
                        <div className="text-[11px] text-slate-500">{p.age} years old</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral" className="uppercase text-[10px] font-semibold">
                          {p.sport}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-xs text-emerald-600">
                          {p.attendancePercentage.toFixed(1)}%
                        </span>{" "}
                        <span className="text-[11px] text-slate-400">
                          ({p.presentSessions}/{p.heldSessions})
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-brand-navy">
                          <Trophy className="w-3.5 h-3.5 text-emerald-500" />
                          {p.matchesPlayed} Matches
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" dot>
                          READY
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDossier(p.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                        >
                          Scout Dossier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Page {page} of {totalPages}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* SCOUTING DOSSIER MODAL */}
        <Modal
          isOpen={Boolean(selectedPlayerId)}
          onClose={() => {
            setSelectedPlayerId(null);
            setDossier(null);
            setDossierError(null);
          }}
          title={dossier ? `Scouting Dossier: ${dossier.player.name}` : "Athlete Scouting Dossier"}
          description={
            dossier
              ? `${dossier.player.age} yrs • Sport: ${dossier.player.sport.toUpperCase()} • Verified Trial Candidate`
              : ""
          }
        >
          {isLoadingDossier ? (
            <div className="py-10 text-center text-xs text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
              Re-evaluating live readiness & compiling dossier...
            </div>
          ) : dossierError ? (
            <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4" />
                <span>Restricted Access</span>
              </div>
              <p>{dossierError}</p>
            </div>
          ) : dossier ? (
            <div className="space-y-4 pt-2">
              {/* Evidence Metrics */}
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">
                    Attendance Record
                  </span>
                  <strong className="text-emerald-600 font-bold text-sm">
                    {dossier.readinessEvidence.attendancePercentage.toFixed(1)}%
                  </strong>
                  <span className="text-slate-400 block text-[10px]">
                    {dossier.readinessEvidence.presentSessions} of{" "}
                    {dossier.readinessEvidence.heldSessions} sessions present
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-semibold">
                    Finalized Matches
                  </span>
                  <strong className="text-brand-navy font-bold text-sm">
                    {dossier.readinessEvidence.matchesPlayed} Matches
                  </strong>
                  <span className="text-slate-400 block text-[10px]">Satisfies trial criteria</span>
                </div>
              </div>

              {/* Match Performance Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Match Performance & Scores
                </h4>
                {dossier.matchHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No matches recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-lg divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {dossier.matchHistory.map((m) => (
                      <div
                        key={m.id}
                        className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50"
                      >
                        <div>
                          <div className="font-semibold text-slate-800">vs. {m.opponent}</div>
                          <div className="text-[11px] text-slate-400">
                            {formatCalendarDate(m.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-brand-primary text-sm">
                            {m.score} {m.scoreUnit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setDossier(null);
                  }}
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </main>
    </div>
  );
}
