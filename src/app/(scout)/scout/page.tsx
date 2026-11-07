"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  Search,
  LogOut,
  Award,
  Eye,
  RefreshCw,
  Trophy,
  AlertTriangle,
  Calendar,
  Sparkles,
  Mail,
} from "lucide-react";
import { SportSyncLogo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { formatSkillLabel } from "@/lib/constants/skills";
import { ThemeToggle } from "@/components/theme/theme-toggle";

interface ReadyAthleteSummary {
  id: string;
  name: string;
  age: number;
  sport: string;
  skill?: string;
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
    skill?: string;
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
    playerRoleSnapshot?: string;
    formattedSummary?: string;
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
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Continue
    }
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-brand-navy dark:text-[#F8FAFC]">
      {/* Top Header */}
      <header className="sticky top-0 z-30 border-b border-slate-200/90 dark:border-[#26344B] bg-white/95 dark:bg-[#111C30]/95 px-4 sm:px-8 py-3.5 backdrop-blur-md flex justify-between items-center shadow-xs">
        <SportSyncLogo size="sm" href="/scout" />
        <div className="flex items-center gap-3">
          <ThemeToggle align="right" />
          <Badge variant="success" dot className="font-semibold text-xs">
            Talent Scout Registry
          </Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            leftIcon={<LogOut className="h-3.5 w-3.5" />}
            className="text-xs font-bold rounded-lg border-slate-200 dark:border-[#26344B] text-slate-600 dark:text-[#94A3B8] hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30"
          >
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-5xl mx-auto w-full p-4 sm:p-8 space-y-6 flex-1">
        {/* Scout Desk Hero Banner */}
        <div className="relative rounded-2xl border border-emerald-200/80 dark:border-emerald-900/60 bg-gradient-to-r from-emerald-50/90 via-emerald-100/30 to-teal-50/70 dark:from-emerald-950/40 dark:via-[#111C30] dark:to-teal-950/30 p-6 sm:p-7 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 overflow-hidden">
          <div className="flex items-center gap-4 sm:gap-5">
            <div className="h-16 w-16 sm:h-18 sm:w-18 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 text-white flex items-center justify-center font-bold text-2xl shadow-md ring-4 ring-white dark:ring-emerald-900/50">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-brand-navy dark:text-[#F8FAFC] tracking-tight">
                  Scout Talent Discovery
                </h1>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <Sparkles className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Live Registry
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-1">
                Dumka Sports Academy &bull; Authorized Talent Discovery & Scouting Desk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchReadyPlayers}
              isLoading={isLoading}
              leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
              className="text-xs font-bold rounded-xl border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#111C30] text-slate-700 dark:text-[#F8FAFC] hover:bg-slate-50 dark:hover:bg-[#0B1120] shadow-2xs"
            >
              Refresh Registry
            </Button>
          </div>
        </div>

        {/* 3 Metric Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Qualified Talent Pool
            </span>
            <p className="text-3xl font-black text-brand-navy dark:text-[#F8FAFC]">{totalCount}</p>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8]/70">Verified trial-ready athletes</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Qualification Criteria
            </span>
            <p className="text-lg font-black text-emerald-700 dark:text-emerald-400">≥ 75% Attendance + ≥ 2 Matches</p>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8]/70">Exact unrounded ratio required</p>
          </div>

          <div className="rounded-2xl border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] p-5 shadow-2xs space-y-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-[#94A3B8]">
              Privacy Protection
            </span>
            <p className="text-lg font-black text-blue-700 dark:text-blue-400">Real-Time Revocation</p>
            <p className="text-xs text-slate-400 dark:text-[#94A3B8]/70">Zero access to unready athletes</p>
          </div>
        </div>

        {/* Talent Filter & Table Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] shadow-2xs overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-[#26344B] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-black text-brand-navy dark:text-[#F8FAFC] flex items-center gap-2">
                <Award className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                Verified Ready Prospects ({totalCount})
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#94A3B8] mt-0.5">
                Athletes meeting all objective criteria for trial evaluation and scout contact
              </p>
            </div>

            {/* Filter and Search Inputs */}
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <div className="relative w-full sm:w-60">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-[#94A3B8]">
                  <Search className="h-3.5 w-3.5" />
                </div>
                <input
                  type="text"
                  placeholder="Search athlete name..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="flex h-10 w-full rounded-xl border border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#0B1120] pl-9 pr-3 py-2 text-xs text-brand-navy dark:text-[#F8FAFC] shadow-2xs placeholder:text-slate-400 dark:placeholder:text-[#94A3B8]/60 focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:outline-hidden focus:ring-2 focus:ring-brand-primary/20"
                />
              </div>

              <select
                value={sportFilter}
                onChange={(e) => {
                  setSportFilter(e.target.value);
                  setPage(1);
                }}
                className="h-10 rounded-xl border border-slate-300 dark:border-[#26344B] bg-white dark:bg-[#0B1120] px-3 py-2 text-xs font-semibold text-slate-700 dark:text-[#F8FAFC] shadow-2xs focus:border-brand-primary dark:focus:border-[#4B8BFF] focus:outline-hidden"
              >
                <option value="">All Disciplines</option>
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="athletics">Athletics</option>
                <option value="badminton">Badminton</option>
              </select>
            </div>
          </div>

          <div>
            {error && (
              <div className="m-4 rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prospect</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Verified Attendance</TableHead>
                  <TableHead>Match Fixtures</TableHead>
                  <TableHead>Readiness</TableHead>
                  <TableHead className="text-right">Scouting Dossier</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-400">
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
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {p.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-brand-navy text-xs">{p.name}</div>
                            <div className="text-[11px] text-slate-400">
                              {p.age} years old &bull;{" "}
                              <span className="font-semibold text-emerald-700">
                                {formatSkillLabel(p.skill)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {p.sport}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="font-black text-xs text-emerald-600">
                              {p.attendancePercentage.toFixed(1)}%
                            </span>
                            <span className="text-[11px] text-slate-400">
                              ({p.presentSessions}/{p.heldSessions})
                            </span>
                          </div>
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className="bg-emerald-500 h-full rounded-full"
                              style={{ width: `${Math.min(100, p.attendancePercentage)}%` }}
                            />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
                          <Trophy className="w-3 h-3 text-amber-600" />
                          <span>{p.matchesPlayed} Matches</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="success" dot className="font-bold">
                          READY
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenDossier(p.id)}
                          leftIcon={<Eye className="w-3.5 h-3.5" />}
                          className="font-bold rounded-xl text-xs shadow-2xs"
                        >
                          View Dossier
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between p-4 border-t border-slate-100 text-xs">
                <span className="text-slate-500">
                  Page {page} of {totalPages} &bull; {totalCount} Prospects
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page <= 1}
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    className="rounded-lg text-xs"
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page >= totalPages}
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    className="rounded-lg text-xs"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SCOUTING DOSSIER MODAL */}
        <Modal
          isOpen={Boolean(selectedPlayerId)}
          onClose={() => {
            setSelectedPlayerId(null);
            setDossier(null);
            setDossierError(null);
          }}
          title={
            dossier
              ? `Athlete Scouting Dossier: ${dossier.player.name}`
              : "Athlete Scouting Dossier"
          }
          description={
            dossier
              ? `${dossier.player.age} yrs • Sport: ${dossier.player.sport.toUpperCase()} • Specialization: ${formatSkillLabel(dossier.player.skill).toUpperCase()} • Verified Candidate`
              : ""
          }
        >
          {isLoadingDossier ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <RefreshCw className="w-7 h-7 animate-spin mx-auto mb-3 text-brand-primary" />
              Re-evaluating live readiness & compiling performance dossier...
            </div>
          ) : dossierError ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 space-y-2">
              <div className="flex items-center gap-2 font-bold">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Restricted Access</span>
              </div>
              <p>{dossierError}</p>
            </div>
          ) : dossier ? (
            <div className="space-y-4 pt-2">
              {/* Evidence Metrics */}
              <div className="grid grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">
                    Attendance Record
                  </span>
                  <strong className="text-emerald-600 font-black text-base">
                    {dossier.readinessEvidence.attendancePercentage.toFixed(1)}%
                  </strong>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    {dossier.readinessEvidence.presentSessions} of{" "}
                    {dossier.readinessEvidence.heldSessions} sessions present
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px] uppercase font-bold">
                    Finalized Matches
                  </span>
                  <strong className="text-brand-navy font-black text-base">
                    {dossier.readinessEvidence.matchesPlayed} Matches
                  </strong>
                  <span className="text-slate-400 block text-[11px] mt-0.5">
                    Satisfies trial criteria
                  </span>
                </div>
              </div>

              {/* Match Performance Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2 flex items-center gap-1.5">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                  Official Match Performances & Scores
                </h4>
                {dossier.matchHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No matches recorded.</p>
                ) : (
                  <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 max-h-56 overflow-y-auto">
                    {dossier.matchHistory.map((m) => (
                      <div
                        key={m.id}
                        className="p-3 flex items-center justify-between text-xs bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div>
                          <div className="font-bold text-brand-navy">vs. {m.opponent}</div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <Calendar className="w-3 h-3" />
                            {formatCalendarDate(m.date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-brand-primary text-sm px-2.5 py-1 rounded-lg bg-blue-50 border border-blue-200">
                            {m.formattedSummary || `${m.score} ${m.scoreUnit}`}
                          </span>
                          {m.playerRoleSnapshot && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              {formatSkillLabel(m.playerRoleSnapshot)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Coach Contact Box for Scouts */}
              <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/80 text-emerald-950 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5 text-emerald-900">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Trial Invitation & Scouting Inquiry
                </p>
                <p className="text-slate-700 leading-relaxed text-[11px]">
                  To invite this athlete for trials or request verified documents, contact the Dumka
                  Head Coach at:
                </p>
                <div className="flex items-center gap-2 pt-1 font-mono text-xs font-bold text-brand-navy">
                  <Mail className="w-3.5 h-3.5 text-brand-primary" />
                  <span>coach@dumkasports.org</span>
                </div>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedPlayerId(null);
                    setDossier(null);
                  }}
                  className="rounded-xl font-bold"
                >
                  Close Dossier
                </Button>
              </div>
            </div>
          ) : null}
        </Modal>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-[#26344B] bg-white dark:bg-[#111C30] py-4 text-center text-xs text-slate-400 dark:text-[#94A3B8]">
        &copy; {new Date().getFullYear()} SportSync &bull; Dumka Sports Academy Management Desk
      </footer>
    </div>
  );
}
