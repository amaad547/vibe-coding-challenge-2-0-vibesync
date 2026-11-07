"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
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
import {
  Trophy,
  Plus,
  Calendar,
  Users,
  Eye,
  AlertTriangle,
  RefreshCw,
  Search,
  Lock,
  Sparkles,
} from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/date";
import { formatSkillLabel, formatMatchPerformance, ParticipantStats } from "@/lib/constants/skills";

interface MatchParticipant {
  playerId: string;
  playerNameSnapshot: string;
  playerRoleSnapshot?: string;
  score: number;
  scoreMetric: string;
  scoreUnit: string;
  stats?: ParticipantStats;
  formattedSummary?: string;
}

interface MatchRecord {
  id: string;
  date: string;
  sport: string;
  opponent: string;
  sessionId: string;
  totalParticipants: number;
  topScore: number;
  participants: MatchParticipant[];
  status: "FINALIZED";
  createdBy: string;
  createdAt: string;
}

interface ClosedSessionOption {
  id: string;
  date: string;
  sport: string;
  status: "CLOSED";
  totalRoster: number;
  presentCount: number;
}

interface SessionRosterEntry {
  playerId: string;
  playerNameSnapshot: string;
  playerSkillSnapshot?: string;
  status: "PRESENT" | "ABSENT" | null;
}

interface SportMeta {
  sport: string;
  scoreMetric: string;
  scoreUnit: string;
}

interface ParticipantFormEntry {
  selected: boolean;
  score: number;
  role: string;
  stats: {
    runs: number;
    wickets: number;
    overs?: number;
    goals: number;
    assists: number;
    points: number;
    rebounds: number;
    sets: number;
    time?: string;
    distance?: string;
  };
}

export default function CoachMatchesPage() {
  const router = useRouter();

  // Matches List State
  const [matches, setMatches] = React.useState<MatchRecord[]>([]);
  const [sportFilter, setSportFilter] = React.useState("");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Available Closed Sessions for Creation
  const [closedSessions, setClosedSessions] = React.useState<ClosedSessionOption[]>([]);
  const [sportsMeta, setSportsMeta] = React.useState<Record<string, SportMeta>>({});

  // Record Match Modal State
  const [isRecordModalOpen, setIsRecordModalOpen] = React.useState(false);
  const [selectedSessionId, setSelectedSessionId] = React.useState("");
  const [sessionRoster, setSessionRoster] = React.useState<SessionRosterEntry[]>([]);
  const [isLoadingRoster, setIsLoadingRoster] = React.useState(false);
  const [opponent, setOpponent] = React.useState("");
  const [matchDate, setMatchDate] = React.useState("");
  const [matchSport, setMatchSport] = React.useState("");
  const [selectedParticipants, setSelectedParticipants] = React.useState<
    Record<string, ParticipantFormEntry>
  >({});
  const [isSubmittingMatch, setIsSubmittingMatch] = React.useState(false);
  const [recordError, setRecordError] = React.useState<string | null>(null);

  // View Match Details Modal State
  const [selectedMatch, setSelectedMatch] = React.useState<MatchRecord | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState(false);

  // 1. Fetch Matches
  const fetchMatches = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sportFilter) params.set("sport", sportFilter);

      const res = await fetch(`/api/matches?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data?.matches) {
        setMatches(json.data.matches);
      }
    } catch {
      setError("Failed to load match history. Please check your network connection.");
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, router]);

  // 2. Fetch Closed Sessions
  const fetchClosedSessions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sessions?status=CLOSED");
      const json = await res.json();
      if (json.data?.sessions) {
        setClosedSessions(json.data.sessions);
      }
    } catch (err) {
      console.error("Failed to load closed sessions:", err);
    }
  }, []);

  // 3. Fetch Sports Metadata
  const fetchSportsMeta = React.useCallback(async () => {
    try {
      const res = await fetch("/api/sports");
      const json = await res.json();
      if (json.data?.sports) {
        const metaMap: Record<string, SportMeta> = {};
        for (const s of json.data.sports) {
          metaMap[s.sport.toLowerCase()] = s;
        }
        setSportsMeta(metaMap);
      }
    } catch (err) {
      console.error("Failed to load sport configs:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchMatches();
    fetchClosedSessions();
    fetchSportsMeta();
  }, [fetchMatches, fetchClosedSessions, fetchSportsMeta]);

  // When a closed session is selected in the creation modal, fetch its roster
  const handleSelectSession = async (sessionId: string) => {
    setSelectedSessionId(sessionId);
    setSelectedParticipants({});
    setRecordError(null);

    const targetSession = closedSessions.find((s) => s.id === sessionId);
    if (!targetSession) {
      setMatchDate("");
      setMatchSport("");
      setSessionRoster([]);
      return;
    }

    setMatchDate(formatCalendarDate(targetSession.date));
    setMatchSport(targetSession.sport);
    setIsLoadingRoster(true);

    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const json = await res.json();
      if (res.ok && json.data?.session?.roster) {
        const roster: SessionRosterEntry[] = json.data.session.roster;
        setSessionRoster(roster);

        // Pre-select PRESENT players with sport-specific default stats
        const initialSelection: Record<string, ParticipantFormEntry> = {};
        for (const player of roster) {
          if (player.status === "PRESENT") {
            initialSelection[player.playerId] = {
              selected: true,
              score: 0,
              role: player.playerSkillSnapshot || "all_rounder",
              stats: {
                runs: 0,
                wickets: 0,
                goals: 0,
                assists: 0,
                points: 0,
                rebounds: 0,
                sets: 0,
              },
            };
          }
        }
        setSelectedParticipants(initialSelection);
      }
    } catch {
      setRecordError("Failed to load roster for the selected session.");
    } finally {
      setIsLoadingRoster(false);
    }
  };

  // Toggle player selection
  const handleTogglePlayer = (playerId: string) => {
    setSelectedParticipants((prev) => {
      const current = prev[playerId];
      if (!current) return prev;
      return {
        ...prev,
        [playerId]: { ...current, selected: !current.selected },
      };
    });
  };

  // Update specific sport stat for player
  const handleStatChange = (
    playerId: string,
    field: "runs" | "wickets" | "goals" | "assists" | "points" | "rebounds" | "sets" | "score",
    valStr: string
  ) => {
    const val = Math.max(0, parseInt(valStr, 10) || 0);
    setSelectedParticipants((prev) => {
      const current = prev[playerId];
      if (!current) return prev;

      const updatedStats = { ...current.stats, [field]: val };
      let newScore = current.score;

      // Automatically sync primary score with main metric
      if (field === "runs") newScore = val;
      else if (field === "goals") newScore = val;
      else if (field === "points") newScore = val;
      else if (field === "sets") newScore = val;
      else if (field === "score") newScore = val;

      return {
        ...prev,
        [playerId]: {
          ...current,
          score: newScore,
          stats: updatedStats,
        },
      };
    });
  };

  // Submit Match Record
  const handleSubmitMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSessionId) {
      setRecordError("Please select a closed practice session.");
      return;
    }
    if (!opponent.trim()) {
      setRecordError("Please enter the opponent team / academy name.");
      return;
    }

    // Filter only selected participants
    const participantsPayload = Object.entries(selectedParticipants)
      .filter(([_, data]) => data.selected)
      .map(([playerId, data]) => {
        let finalScore = data.score;
        const normSport = matchSport.toLowerCase();
        if (normSport === "cricket") {
          finalScore = data.stats.runs ?? 0;
        } else if (normSport === "football") {
          finalScore = data.stats.goals ?? 0;
        } else if (normSport === "basketball") {
          finalScore = data.stats.points ?? 0;
        }
        return {
          playerId,
          playerRole: data.role,
          score: finalScore,
          stats: data.stats,
        };
      });

    if (participantsPayload.length === 0) {
      setRecordError("At least one eligible (PRESENT) athlete must participate in the match.");
      return;
    }

    setIsSubmittingMatch(true);
    setRecordError(null);

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: selectedSessionId,
          date: matchDate,
          sport: matchSport,
          opponent: opponent.trim(),
          participants: participantsPayload,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setRecordError(json.error?.message || "Failed to finalize match.");
        setIsSubmittingMatch(false);
        return;
      }

      setIsRecordModalOpen(false);
      resetRecordModal();
      await fetchMatches();
    } catch {
      setRecordError("Network error while recording match.");
    } finally {
      setIsSubmittingMatch(false);
    }
  };

  const resetRecordModal = () => {
    setSelectedSessionId("");
    setSessionRoster([]);
    setOpponent("");
    setMatchDate("");
    setMatchSport("");
    setSelectedParticipants({});
    setRecordError(null);
  };

  // Filter matches by search query (opponent, sport, or player name)
  const filteredMatches = matches.filter((m) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      m.opponent.toLowerCase().includes(q) ||
      m.sport.toLowerCase().includes(q) ||
      m.participants.some((p) => p.playerNameSnapshot.toLowerCase().includes(q))
    );
  });

  const activeSportMeta = sportsMeta[matchSport.toLowerCase()] || {
    scoreMetric: "Points",
    scoreUnit: "Points",
  };

  return (
    <AppShell role="COACH">
      <div className="space-y-6">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-brand-navy">
              Match & Score Management
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Record finalized match scorecards linked to closed practice sessions with
              sport-specific metrics (runs, wickets, goals, assists, and points).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchMatches();
                fetchClosedSessions();
              }}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetRecordModal();
                setIsRecordModalOpen(true);
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Record Match
            </Button>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-brand-primary">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                Matches Finalized
              </CardDescription>
              <CardTitle className="text-2xl font-extrabold text-brand-navy">
                {matches.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Official academy match sheets</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                Eligible Practice Sessions
              </CardDescription>
              <CardTitle className="text-2xl font-extrabold text-emerald-600">
                {closedSessions.length}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">Closed & locked practice sessions</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500">
            <CardHeader className="pb-2">
              <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                Active Sports
              </CardDescription>
              <CardTitle className="text-2xl font-extrabold text-brand-navy">
                {new Set(matches.map((m) => m.sport)).size || 1}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-500">With finalized match scorecards</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="w-full md:w-72">
                <Input
                  placeholder="Search by opponent or player..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  leftIcon={<Search className="w-4 h-4 text-slate-400" />}
                />
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
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

        {/* Matches Table */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Match Scorecard History</CardTitle>
            <CardDescription>
              Official match records contributing towards athlete trial readiness (minimum 2 matches
              required)
            </CardDescription>
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
                  <TableHead>Date</TableHead>
                  <TableHead>Sport</TableHead>
                  <TableHead>Opponent</TableHead>
                  <TableHead>Squad</TableHead>
                  <TableHead>Top Performance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-10 text-slate-400">
                      <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-brand-primary" />
                      Loading match fixtures...
                    </TableCell>
                  </TableRow>
                ) : filteredMatches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7}>
                      <TableEmpty
                        message="No match records found"
                        description={
                          sportFilter || searchQuery
                            ? "No matches match the selected filters."
                            : "No official matches recorded yet. Open and close a practice session to record your first match."
                        }
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredMatches.map((match) => {
                    const topScorer =
                      match.participants.length > 0
                        ? match.participants.reduce(
                            (prev, curr) => (curr.score > prev.score ? curr : prev),
                            match.participants[0]!
                          )
                        : null;

                    return (
                      <TableRow key={match.id} className="hover:bg-slate-50/70">
                        <TableCell className="font-semibold text-slate-800">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            {formatCalendarDate(match.date)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="uppercase font-semibold">
                            {match.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-brand-navy">
                          vs. {match.opponent}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            {match.totalParticipants} Athletes
                          </div>
                        </TableCell>
                        <TableCell>
                          {topScorer ? (
                            <div className="text-xs">
                              <span className="font-bold text-slate-800">
                                {topScorer.playerNameSnapshot}:
                              </span>{" "}
                              <span className="font-black text-brand-primary">
                                {topScorer.formattedSummary ||
                                  `${topScorer.score} ${topScorer.scoreUnit}`}
                              </span>
                            </div>
                          ) : (
                            "—"
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="success">
                            <Lock className="w-3 h-3 mr-1 inline" /> FINALIZED
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMatch(match);
                              setIsDetailModalOpen(true);
                            }}
                            leftIcon={<Eye className="w-4 h-4" />}
                            className="font-bold text-xs"
                          >
                            Scorecard
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* MODAL: RECORD MATCH SHEET */}
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          title="Record Official Match Sheet"
          description="Link an official fixture to a closed practice session. Add runs for batsmen, wickets for bowlers, and sport-specific stats."
        >
          <form onSubmit={handleSubmitMatch} className="space-y-4 pt-2">
            {recordError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{recordError}</span>
              </div>
            )}

            {/* 1. Select Closed Practice Session */}
            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold tracking-wide text-brand-navy">
                Link to Closed Practice Session
              </label>
              {closedSessions.length === 0 ? (
                <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  No CLOSED practice sessions available. You must conduct and close a practice
                  session before creating a match on the same date and sport.
                </div>
              ) : (
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectSession(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-brand-navy focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                >
                  <option value="">-- Choose a closed session --</option>
                  {closedSessions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {formatCalendarDate(s.date)} &bull; {s.sport.toUpperCase()} &bull; (
                      {s.presentCount} Present of {s.totalRoster})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Session Auto-Derived Details */}
            {selectedSessionId && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Match Date (Derived)</span>
                  <strong className="text-brand-navy">{matchDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sport (Derived)</span>
                  <strong className="text-brand-navy uppercase">{matchSport}</strong>
                </div>
              </div>
            )}

            {/* 2. Opponent Name */}
            {selectedSessionId && (
              <Input
                label="Opponent Team / Academy"
                required
                placeholder="e.g. Ranchi Warriors or Tata Football Academy"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
              />
            )}

            {/* 3. Participating Athletes and Sport-Specific Performance Inputs */}
            {selectedSessionId && (
              <div className="space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold tracking-wide text-brand-navy">
                    Participating Athletes & Sport-Specific Scores
                  </label>
                  <span className="text-[11px] text-slate-500">
                    Only Present athletes may participate
                  </span>
                </div>

                {isLoadingRoster ? (
                  <div className="p-4 text-center text-xs text-slate-400">
                    Loading session attendance roster...
                  </div>
                ) : sessionRoster.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No athletes in this session roster.
                  </p>
                ) : (
                  <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                    {sessionRoster.map((player) => {
                      const isPresent = player.status === "PRESENT";
                      const selection = selectedParticipants[player.playerId] || {
                        selected: false,
                        score: 0,
                        role: player.playerSkillSnapshot || "all_rounder",
                        stats: {
                          runs: 0,
                          wickets: 0,
                          goals: 0,
                          assists: 0,
                          points: 0,
                          rebounds: 0,
                          sets: 0,
                        },
                      };

                      const normSport = matchSport.toLowerCase();

                      return (
                        <div
                          key={player.playerId}
                          className={`p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                            isPresent
                              ? "bg-white hover:bg-slate-50/80"
                              : "bg-slate-50/70 opacity-60"
                          }`}
                        >
                          {/* Athlete & Checkbox */}
                          <div className="flex items-center gap-2.5 min-w-0">
                            {isPresent ? (
                              <input
                                type="checkbox"
                                checked={selection.selected}
                                onChange={() => handleTogglePlayer(player.playerId)}
                                className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4 border-slate-300"
                              />
                            ) : (
                              <span className="h-4 w-4 flex items-center justify-center text-rose-500 font-black">
                                &times;
                              </span>
                            )}
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`font-bold ${
                                    isPresent ? "text-brand-navy" : "text-slate-400 line-through"
                                  }`}
                                >
                                  {player.playerNameSnapshot}
                                </span>
                                <Badge variant="neutral" className="text-[10px] py-0 px-1.5">
                                  {formatSkillLabel(player.playerSkillSnapshot)}
                                </Badge>
                              </div>
                              {!isPresent && (
                                <span className="text-[10px] text-rose-600 font-semibold block">
                                  Ineligible (Marked Absent in Session)
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Dynamic Sport-Specific Score Inputs */}
                          {isPresent && selection.selected && (
                            <div className="flex items-center gap-3 shrink-0 bg-slate-50 p-2 rounded-lg border border-slate-200">
                              {/* CRICKET: Batsman Runs & Bowler Wickets */}
                              {normSport === "cricket" && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      Runs:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.runs ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "runs", e.target.value)
                                      }
                                      className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-emerald-700">
                                      Wkts:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.wickets ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "wickets", e.target.value)
                                      }
                                      className="w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-emerald-800 focus:border-brand-primary"
                                    />
                                  </div>
                                </>
                              )}

                              {/* FOOTBALL: Goals & Assists */}
                              {normSport === "football" && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      Goals ⚽:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.goals ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "goals", e.target.value)
                                      }
                                      className="w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-indigo-700">
                                      Assists 👟:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.assists ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "assists", e.target.value)
                                      }
                                      className="w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-indigo-800 focus:border-brand-primary"
                                    />
                                  </div>
                                </>
                              )}

                              {/* BASKETBALL: PTS, REB, AST */}
                              {normSport === "basketball" && (
                                <>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      PTS:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.points ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "points", e.target.value)
                                      }
                                      className="w-14 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary"
                                    />
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <span className="text-[11px] font-bold text-slate-600">
                                      REB:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.stats.rebounds ?? 0}
                                      onChange={(e) =>
                                        handleStatChange(
                                          player.playerId,
                                          "rebounds",
                                          e.target.value
                                        )
                                      }
                                      className="w-12 rounded-md border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary"
                                    />
                                  </div>
                                </>
                              )}

                              {/* OTHER SPORTS: Generic Score Metric */}
                              {normSport !== "cricket" &&
                                normSport !== "football" &&
                                normSport !== "basketball" && (
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[11px] text-slate-600 font-bold">
                                      {activeSportMeta.scoreMetric}:
                                    </span>
                                    <input
                                      type="number"
                                      min="0"
                                      value={selection.score}
                                      onChange={(e) =>
                                        handleStatChange(player.playerId, "score", e.target.value)
                                      }
                                      className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary"
                                    />
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsRecordModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                disabled={isSubmittingMatch || !selectedSessionId || closedSessions.length === 0}
                isLoading={isSubmittingMatch}
                leftIcon={<Trophy className="w-4 h-4" />}
              >
                Finalize Match Sheet
              </Button>
            </div>
          </form>
        </Modal>

        {/* VIEW MATCH SCORECARD DETAILS MODAL (ESPN / CRICBUZZ STYLE SCORECARD) */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={
            selectedMatch ? `Match Scorecard: vs. ${selectedMatch.opponent}` : "Match Scorecard"
          }
          description={
            selectedMatch
              ? `${formatCalendarDate(selectedMatch.date)} • ${selectedMatch.sport.toUpperCase()} • Official Finalized Fixture`
              : ""
          }
        >
          {selectedMatch && (
            <div className="space-y-4 pt-2">
              {/* Fixture Summary Cards */}
              <div className="grid grid-cols-3 gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Fixture Date</span>
                  <strong className="text-brand-navy">
                    {formatCalendarDate(selectedMatch.date)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Sport Discipline</span>
                  <strong className="text-brand-navy uppercase">{selectedMatch.sport}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Participating Squad</span>
                  <strong className="text-brand-navy font-bold">
                    {selectedMatch.totalParticipants} Athletes
                  </strong>
                </div>
              </div>

              {/* Sport-Specific Scorecard Table */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" />
                    Official Performance Scorecard
                  </h4>
                  <span className="text-[10px] text-slate-400 font-medium">
                    Verified against session roster
                  </span>
                </div>

                {/* CRICKET SCORECARD TABLE */}
                {selectedMatch.sport.toLowerCase() === "cricket" ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Athlete</th>
                          <th className="py-2.5 px-2">Role</th>
                          <th className="py-2.5 px-2 text-right">Runs</th>
                          <th className="py-2.5 px-2 text-right">Wickets</th>
                          <th className="py-2.5 px-3 text-right">Match Performance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedMatch.participants.map((p) => (
                          <tr key={p.playerId} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-brand-navy">
                              {p.playerNameSnapshot}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {formatSkillLabel(p.playerRoleSnapshot)}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-black text-brand-navy">
                              {p.stats?.runs ?? p.score}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-emerald-700">
                              {p.stats?.wickets ?? 0} wkts
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-bold text-brand-primary text-xs">
                                {p.formattedSummary ||
                                  formatMatchPerformance(
                                    "cricket",
                                    p.score,
                                    p.stats,
                                    p.playerRoleSnapshot
                                  )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : selectedMatch.sport.toLowerCase() === "football" ? (
                  /* FOOTBALL SCORECARD TABLE */
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Player</th>
                          <th className="py-2.5 px-2">Position</th>
                          <th className="py-2.5 px-2 text-right">Goals ⚽</th>
                          <th className="py-2.5 px-2 text-right">Assists 👟</th>
                          <th className="py-2.5 px-3 text-right">Match Contribution</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedMatch.participants.map((p) => (
                          <tr key={p.playerId} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-brand-navy">
                              {p.playerNameSnapshot}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {formatSkillLabel(p.playerRoleSnapshot)}
                              </span>
                            </td>
                            <td className="py-2.5 px-2 text-right font-black text-brand-primary">
                              {p.stats?.goals ?? p.score}
                            </td>
                            <td className="py-2.5 px-2 text-right font-bold text-indigo-700">
                              {p.stats?.assists ?? 0}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 font-bold text-emerald-800 text-xs">
                                {p.formattedSummary ||
                                  formatMatchPerformance(
                                    "football",
                                    p.score,
                                    p.stats,
                                    p.playerRoleSnapshot
                                  )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  /* GENERIC / BASKETBALL SCORECARD TABLE */
                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-bold text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Athlete</th>
                          <th className="py-2.5 px-2">Role</th>
                          <th className="py-2.5 px-3 text-right">Performance & Score</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedMatch.participants.map((p) => (
                          <tr key={p.playerId} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-3 font-bold text-brand-navy">
                              {p.playerNameSnapshot}
                            </td>
                            <td className="py-2.5 px-2">
                              <span className="text-[11px] font-semibold text-slate-600">
                                {formatSkillLabel(p.playerRoleSnapshot)}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-blue-50 border border-blue-200 font-black text-brand-primary text-xs">
                                {p.formattedSummary || `${p.score} ${p.scoreUnit}`}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close Scorecard
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
