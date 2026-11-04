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
} from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/date";

interface MatchParticipant {
  playerId: string;
  playerNameSnapshot: string;
  score: number;
  scoreMetric: string;
  scoreUnit: string;
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
  status: "PRESENT" | "ABSENT" | null;
}

interface SportMeta {
  sport: string;
  scoreMetric: string;
  scoreUnit: string;
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
    Record<string, { selected: boolean; score: number }>
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

        // Pre-select PRESENT players with default score 0
        const initialSelection: Record<string, { selected: boolean; score: number }> = {};
        for (const player of roster) {
          if (player.status === "PRESENT") {
            initialSelection[player.playerId] = { selected: true, score: 0 };
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
      const current = prev[playerId] || { selected: false, score: 0 };
      return {
        ...prev,
        [playerId]: { ...current, selected: !current.selected },
      };
    });
  };

  // Update participant score
  const handleScoreChange = (playerId: string, scoreVal: string) => {
    const num = Math.max(0, parseInt(scoreVal, 10) || 0);
    setSelectedParticipants((prev) => {
      const current = prev[playerId] || { selected: true, score: 0 };
      return {
        ...prev,
        [playerId]: { ...current, score: num },
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
      .map(([playerId, data]) => ({
        playerId,
        score: data.score,
      }));

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

  // Filter matches by search query (opponent or sport)
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
              Record finalized match sheets linked to closed practice sessions. Only eligible
              Present athletes may participate.
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
              <p className="text-xs text-slate-500">With finalized match fixtures</p>
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
                  <option value="basketball">Basketball</option>
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
            <CardTitle className="text-base">Match History & Scores</CardTitle>
            <CardDescription>
              Permanent match records contributing towards athlete trial readiness (minimum 2
              matches required)
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
                  <TableHead>Athletes</TableHead>
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
                            <span className="text-xs font-semibold text-slate-700">
                              {topScorer.playerNameSnapshot}:{" "}
                              <strong className="text-brand-primary">
                                {topScorer.score} {topScorer.scoreUnit}
                              </strong>
                            </span>
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
                          >
                            View Sheet
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

        {/* RECORD MATCH MODAL */}
        <Modal
          isOpen={isRecordModalOpen}
          onClose={() => setIsRecordModalOpen(false)}
          title="Record Finalized Match"
          description="Create an official match sheet linked to an existing closed practice session. Only players marked Present in that session can participate."
        >
          <form onSubmit={handleSubmitMatch} className="space-y-4 pt-2">
            {recordError && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{recordError}</span>
              </div>
            )}

            {/* 1. Select Closed Session */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Linked Practice Session <span className="text-rose-500">*</span>
              </label>
              {closedSessions.length === 0 ? (
                <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800">
                  <p className="font-semibold">No closed sessions available</p>
                  <p className="mt-0.5">
                    Matches require a closed and locked practice session on the same date and sport.
                    Please close a practice session from the <strong>Sessions</strong> tab first.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedSessionId}
                  onChange={(e) => handleSelectSession(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:border-brand-primary focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
                  required
                >
                  <option value="">-- Choose a Closed Practice Session --</option>
                  {closedSessions.map((session) => (
                    <option key={session.id} value={session.id}>
                      {formatCalendarDate(session.date)} &bull; {session.sport.toUpperCase()} &bull;
                      ({session.presentCount} Present of {session.totalRoster})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Session Metadata Display (Derived) */}
            {selectedSessionId && (
              <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Match Date (Locked to Session):</span>
                  <strong className="text-brand-navy font-semibold">{matchDate}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sport & Scoring Metric:</span>
                  <strong className="text-brand-navy font-semibold uppercase">
                    {matchSport} ({activeSportMeta.scoreMetric})
                  </strong>
                </div>
              </div>
            )}

            {/* 2. Opponent Name */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Opponent Team / Academy <span className="text-rose-500">*</span>
              </label>
              <Input
                placeholder="e.g. Ranchi United FC, Tata Academy"
                value={opponent}
                onChange={(e) => setOpponent(e.target.value)}
                required
                maxLength={80}
              />
            </div>

            {/* 3. Athlete Selection & Individual Scoring */}
            {selectedSessionId && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Participating Athletes & Scores
                  </label>
                  <span className="text-[11px] text-slate-400 font-medium">
                    Metric: {activeSportMeta.scoreMetric} ({activeSportMeta.scoreUnit})
                  </span>
                </div>

                {isLoadingRoster ? (
                  <div className="py-6 text-center text-xs text-slate-400">
                    <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-1 text-brand-primary" />
                    Loading eligible roster...
                  </div>
                ) : sessionRoster.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">
                    No athletes in this session roster.
                  </p>
                ) : (
                  <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
                    {sessionRoster.map((player) => {
                      const isPresent = player.status === "PRESENT";
                      const selection = selectedParticipants[player.playerId] || {
                        selected: false,
                        score: 0,
                      };

                      return (
                        <div
                          key={player.playerId}
                          className={`p-2.5 flex items-center justify-between gap-3 text-xs ${
                            isPresent ? "bg-white hover:bg-slate-50" : "bg-slate-50/70 opacity-60"
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isPresent ? (
                              <input
                                type="checkbox"
                                checked={selection.selected}
                                onChange={() => handleTogglePlayer(player.playerId)}
                                className="rounded text-brand-primary focus:ring-brand-primary h-4 w-4 border-slate-300"
                              />
                            ) : (
                              <span className="h-4 w-4 flex items-center justify-center text-rose-500">
                                &times;
                              </span>
                            )}
                            <div className="truncate">
                              <span
                                className={`font-semibold ${
                                  isPresent ? "text-slate-800" : "text-slate-400 line-through"
                                }`}
                              >
                                {player.playerNameSnapshot}
                              </span>
                              {!isPresent && (
                                <Badge variant="danger" className="ml-2 text-[10px] py-0 px-1.5">
                                  Ineligible (Absent)
                                </Badge>
                              )}
                            </div>
                          </div>

                          {/* Score Input (Only for Present athletes) */}
                          {isPresent && selection.selected && (
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[11px] text-slate-500 font-medium">
                                {activeSportMeta.scoreMetric}:
                              </span>
                              <input
                                type="number"
                                min="0"
                                value={selection.score}
                                onChange={(e) => handleScoreChange(player.playerId, e.target.value)}
                                className="w-16 rounded border border-slate-300 px-2 py-1 text-xs text-right font-bold text-brand-navy focus:border-brand-primary focus:outline-hidden"
                              />
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

        {/* VIEW MATCH SHEET DETAILS MODAL */}
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={selectedMatch ? `Match vs. ${selectedMatch.opponent}` : "Match Sheet"}
          description={
            selectedMatch
              ? `${formatCalendarDate(selectedMatch.date)} &bull; ${selectedMatch.sport.toUpperCase()} &bull; Finalized Record`
              : ""
          }
        >
          {selectedMatch && (
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 block">Date</span>
                  <strong className="text-brand-navy">
                    {formatCalendarDate(selectedMatch.date)}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Sport</span>
                  <strong className="text-brand-navy uppercase">{selectedMatch.sport}</strong>
                </div>
                <div>
                  <span className="text-slate-500 block">Total Athletes</span>
                  <strong className="text-brand-navy font-bold">
                    {selectedMatch.totalParticipants}
                  </strong>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-2">
                  Athlete Performances & Scores
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto">
                  {selectedMatch.participants.map((p) => (
                    <div
                      key={p.playerId}
                      className="p-2.5 flex items-center justify-between text-xs bg-white hover:bg-slate-50"
                    >
                      <span className="font-semibold text-slate-800">{p.playerNameSnapshot}</span>
                      <span className="font-extrabold text-brand-primary text-sm">
                        {p.score}{" "}
                        <span className="text-xs font-medium text-slate-500">{p.scoreUnit}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDetailModalOpen(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
