"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
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
import { Plus, Lock, Unlock, Check, X, AlertTriangle, RefreshCw, Users, Eye } from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/date";

interface SessionSummary {
  id: string;
  date: string;
  sport: string;
  status: "OPEN" | "CLOSED";
  totalRoster: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  closedAt: string | null;
  createdAt: string;
}

interface RosterPlayer {
  playerId: string;
  playerNameSnapshot: string;
  status: "PRESENT" | "ABSENT" | null;
}

interface ActiveSessionDetails {
  id: string;
  date: string;
  sport: string;
  status: "OPEN" | "CLOSED";
  totalRoster: number;
  presentCount: number;
  absentCount: number;
  unmarkedCount: number;
  roster: RosterPlayer[];
}

export default function CoachSessionsPage() {
  const router = useRouter();

  // Sessions List State
  const [sessions, setSessions] = React.useState<SessionSummary[]>([]);
  const [sportFilter, setSportFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Open Session Modal State
  const [isOpenModalOpen, setIsOpenModalOpen] = React.useState(false);
  const [openDate, setOpenDate] = React.useState(new Date().toISOString().split("T")[0] || "");
  const [openSport, setOpenSport] = React.useState("football");
  const [openError, setOpenError] = React.useState<string | null>(null);
  const [isSubmittingOpen, setIsSubmittingOpen] = React.useState(false);

  // Active Attendance Marking State
  const [activeSession, setActiveSession] = React.useState<ActiveSessionDetails | null>(null);
  const [attendanceMarks, setAttendanceMarks] = React.useState<
    Record<string, "PRESENT" | "ABSENT" | null>
  >({});
  const [isSavingAttendance, setIsSavingAttendance] = React.useState(false);
  const [attendanceMessage, setAttendanceMessage] = React.useState<string | null>(null);

  // Close Session Confirmation State
  const [isCloseModalOpen, setIsCloseModalOpen] = React.useState(false);
  const [isSubmittingClose, setIsSubmittingClose] = React.useState(false);
  const [closeError, setCloseError] = React.useState<string | null>(null);

  // Fetch Sessions
  const fetchSessions = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (sportFilter) params.set("sport", sportFilter);
      if (statusFilter) params.set("status", statusFilter);

      const res = await fetch(`/api/sessions?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data) {
        setSessions(json.data.sessions);
      }
    } catch {
      setError("Failed to load practice sessions. Please check server connection.");
    } finally {
      setIsLoading(false);
    }
  }, [sportFilter, statusFilter, router]);

  React.useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Open Practice Session
  const handleOpenSession = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingOpen(true);
    setOpenError(null);

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: openDate,
          sport: openSport,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setOpenError(json.error?.message || "Failed to open session.");
        setIsSubmittingOpen(false);
        return;
      }

      setIsOpenModalOpen(false);
      await fetchSessions();

      // Open attendance editor directly for newly created session
      if (json.data?.session?.id) {
        loadSessionDetails(json.data.session.id);
      }
    } catch {
      setOpenError("Network error. Please try again.");
    } finally {
      setIsSubmittingOpen(false);
    }
  };

  // Load Session Details for Marking
  const loadSessionDetails = async (sessionId: string) => {
    setAttendanceMessage(null);
    try {
      const res = await fetch(`/api/sessions/${sessionId}`);
      const json = await res.json();
      if (res.ok && json.data?.session) {
        const s = json.data.session as ActiveSessionDetails;
        setActiveSession(s);
        const marks: Record<string, "PRESENT" | "ABSENT" | null> = {};
        for (const p of s.roster) {
          marks[p.playerId] = p.status;
        }
        setAttendanceMarks(marks);
      }
    } catch (err) {
      console.error("Failed to load session details:", err);
    }
  };

  // Mark single player status
  const handleSetMark = (playerId: string, status: "PRESENT" | "ABSENT") => {
    if (activeSession?.status === "CLOSED") return;
    setAttendanceMarks((prev) => ({
      ...prev,
      [playerId]: prev[playerId] === status ? null : status,
    }));
  };

  // Bulk convenience actions
  const handleMarkAll = (status: "PRESENT" | "ABSENT") => {
    if (!activeSession || activeSession.status === "CLOSED") return;
    const next: Record<string, "PRESENT" | "ABSENT" | null> = {};
    for (const p of activeSession.roster) {
      next[p.playerId] = status;
    }
    setAttendanceMarks(next);
  };

  // Save Attendance Marks to API
  const handleSaveAttendance = async () => {
    if (!activeSession || activeSession.status === "CLOSED") return;
    setIsSavingAttendance(true);
    setAttendanceMessage(null);

    const marksPayload = Object.entries(attendanceMarks)
      .filter(([_, status]) => status !== null)
      .map(([playerId, status]) => ({
        playerId,
        status: status as "PRESENT" | "ABSENT",
      }));

    if (marksPayload.length === 0) {
      setAttendanceMessage("Please mark at least one player before saving.");
      setIsSavingAttendance(false);
      return;
    }

    try {
      const res = await fetch(`/api/sessions/${activeSession.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksPayload }),
      });

      const json = await res.json();
      if (res.ok) {
        setAttendanceMessage("Attendance marks saved successfully.");
        await loadSessionDetails(activeSession.id);
        await fetchSessions();
      } else {
        setAttendanceMessage(json.error?.message || "Failed to save attendance.");
      }
    } catch {
      setAttendanceMessage("Network error while saving attendance.");
    } finally {
      setIsSavingAttendance(false);
    }
  };

  // Close Session
  const handleCloseSession = async () => {
    if (!activeSession) return;
    setIsSubmittingClose(true);
    setCloseError(null);

    // Save current marks first if needed
    const marksPayload = Object.entries(attendanceMarks)
      .filter(([_, status]) => status !== null)
      .map(([playerId, status]) => ({
        playerId,
        status: status as "PRESENT" | "ABSENT",
      }));

    if (marksPayload.length < activeSession.roster.length) {
      setCloseError("Cannot close: Every player must be marked Present or Absent before locking.");
      setIsSubmittingClose(false);
      return;
    }

    try {
      // 1. Ensure marks are persisted
      await fetch(`/api/sessions/${activeSession.id}/attendance`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marks: marksPayload }),
      });

      // 2. Close session
      const res = await fetch(`/api/sessions/${activeSession.id}/close`, {
        method: "POST",
      });

      const json = await res.json();
      if (!res.ok) {
        setCloseError(json.error?.message || "Failed to close session.");
        setIsSubmittingClose(false);
        return;
      }

      setIsCloseModalOpen(false);
      await loadSessionDetails(activeSession.id);
      await fetchSessions();
    } catch {
      setCloseError("Network error while closing session.");
    } finally {
      setIsSubmittingClose(false);
    }
  };

  // Compute live progress from marks
  const totalRosterCount = activeSession?.roster.length || 0;
  const markedCount = Object.values(attendanceMarks).filter((s) => s !== null).length;
  const presentCount = Object.values(attendanceMarks).filter((s) => s === "PRESENT").length;
  const absentCount = Object.values(attendanceMarks).filter((s) => s === "ABSENT").length;
  const allMarked = totalRosterCount > 0 && markedCount === totalRosterCount;

  return (
    <AppShell title="Attendance & Sessions" role="COACH">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-navy">Practice Sessions & Attendance</h1>
            <p className="text-xs text-slate-500 mt-1">
              Open dated sport sessions, snapshot active rosters, mark Present/Absent, and lock
              immutable attendance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSessions}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => {
                setOpenError(null);
                setIsOpenModalOpen(true);
              }}
            >
              Open Session
            </Button>
          </div>
        </div>

        {/* ACTIVE SESSION ATTENDANCE DRAWER / CARD */}
        {activeSession && (
          <Card className="border-2 border-brand-primary/40 shadow-md">
            <CardHeader className="bg-slate-50/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">
                    {formatCalendarDate(activeSession.date)}
                  </span>
                  <Badge variant="neutral">{activeSession.sport.toUpperCase()}</Badge>
                  {activeSession.status === "OPEN" ? (
                    <Badge variant="info" dot>
                      <Unlock className="w-3 h-3 mr-1 inline" /> OPEN &bull; Editable
                    </Badge>
                  ) : (
                    <Badge variant="neutral">
                      <Lock className="w-3 h-3 mr-1 inline text-slate-500" /> CLOSED &bull; Locked &
                      Immutable
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-lg mt-1">
                  Session Attendance Desk ({activeSession.sport.toUpperCase()})
                </CardTitle>
                <CardDescription>
                  {activeSession.status === "OPEN"
                    ? "Mark each snapshotted athlete Present or Absent. Once closed, records cannot be altered."
                    : "This session has been closed and locked. Attendance is finalized and counts towards player readiness."}
                </CardDescription>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setActiveSession(null)}>
                  Close Desk
                </Button>
              </div>
            </CardHeader>

            <CardContent className="space-y-4 pt-6">
              {/* Progress and Summary Bar */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-4 text-xs font-semibold">
                  <div>
                    <span className="text-slate-500">Total Roster:</span>{" "}
                    <strong className="text-brand-navy">{totalRosterCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Present:</span>{" "}
                    <strong className="text-emerald-700">{presentCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Absent:</span>{" "}
                    <strong className="text-rose-700">{absentCount}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Progress:</span>{" "}
                    <span
                      className={
                        allMarked ? "text-emerald-700 font-bold" : "text-amber-700 font-bold"
                      }
                    >
                      {markedCount} of {totalRosterCount} marked
                    </span>
                  </div>
                </div>

                {/* Convenience Actions while OPEN */}
                {activeSession.status === "OPEN" && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAll("PRESENT")}
                      className="text-xs"
                    >
                      Mark All Present
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarkAll("ABSENT")}
                      className="text-xs"
                    >
                      Mark All Absent
                    </Button>
                  </div>
                )}
              </div>

              {attendanceMessage && (
                <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-lg">
                  {attendanceMessage}
                </div>
              )}

              {/* Attendance Table */}
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Attendance Mark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activeSession.roster.map((player) => {
                    const currentMark = attendanceMarks[player.playerId];

                    return (
                      <TableRow key={player.playerId}>
                        <TableCell className="font-bold text-brand-navy">
                          {player.playerNameSnapshot}
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral">{activeSession.sport.toUpperCase()}</Badge>
                        </TableCell>
                        <TableCell>
                          {currentMark === "PRESENT" ? (
                            <Badge variant="success" dot>
                              Present
                            </Badge>
                          ) : currentMark === "ABSENT" ? (
                            <Badge variant="danger" dot>
                              Absent
                            </Badge>
                          ) : (
                            <span className="text-xs italic text-slate-400 font-medium">
                              Not marked
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {activeSession.status === "OPEN" ? (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleSetMark(player.playerId, "PRESENT")}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentMark === "PRESENT"
                                    ? "bg-emerald-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700"
                                }`}
                              >
                                <Check className="w-3.5 h-3.5" /> Present
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetMark(player.playerId, "ABSENT")}
                                className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                  currentMark === "ABSENT"
                                    ? "bg-rose-600 text-white shadow-xs"
                                    : "bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700"
                                }`}
                              >
                                <X className="w-3.5 h-3.5" /> Absent
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs font-semibold text-slate-500">
                              {currentMark === "PRESENT" ? "Marked Present" : "Marked Absent"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Bottom Actions */}
              {activeSession.status === "OPEN" && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500">
                    You can save draft marks while open. Closing locks attendance permanently.
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      isLoading={isSavingAttendance}
                      onClick={handleSaveAttendance}
                    >
                      Save Marks
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={!allMarked}
                      onClick={() => {
                        setCloseError(null);
                        setIsCloseModalOpen(true);
                      }}
                      leftIcon={<Lock className="h-3.5 w-3.5" />}
                      title={!allMarked ? "All players must be marked before closing" : undefined}
                    >
                      Close & Lock Session
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* SESSIONS DIRECTORY LIST */}
        <Card>
          <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <CardTitle>Session History</CardTitle>
              <CardDescription>
                All dated practice sessions recorded for Dumka Sports Academy.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <select
                value={sportFilter}
                onChange={(e) => setSportFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Sports</option>
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="athletics">Athletics</option>
                <option value="badminton">Badminton</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="">All Status</option>
                <option value="OPEN">Open Only</option>
                <option value="CLOSED">Closed Only</option>
              </select>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {error ? (
              <div className="p-8 text-center text-rose-600 text-xs">
                <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                <p className="font-semibold">{error}</p>
                <Button variant="outline" size="sm" onClick={fetchSessions} className="mt-3">
                  Retry
                </Button>
              </div>
            ) : isLoading ? (
              <LoadingOverlay message="Loading practice sessions..." />
            ) : sessions.length === 0 ? (
              <TableEmpty
                message="No practice sessions found."
                description="Click 'Open Session' above to begin taking attendance for today's practice."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Roster Breakdown</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessions.map((session) => (
                    <TableRow key={session.id}>
                      <TableCell className="font-bold text-brand-navy">
                        {formatCalendarDate(session.date)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="neutral">{session.sport.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell>
                        {session.status === "OPEN" ? (
                          <Badge variant="info" dot>
                            OPEN
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            <Lock className="w-3 h-3 mr-1 inline text-slate-500" /> CLOSED
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs">
                        <span className="text-emerald-700 font-semibold">
                          {session.presentCount}P
                        </span>
                        {" / "}
                        <span className="text-rose-700 font-semibold">{session.absentCount}A</span>
                        {session.unmarkedCount > 0 && (
                          <span className="text-amber-600 font-semibold">
                            {" "}
                            ({session.unmarkedCount} unmarked)
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {session.totalRoster - session.unmarkedCount} of {session.totalRoster}{" "}
                        marked
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant={session.status === "OPEN" ? "primary" : "outline"}
                          size="sm"
                          onClick={() => loadSessionDetails(session.id)}
                          leftIcon={
                            session.status === "OPEN" ? (
                              <Users className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )
                          }
                        >
                          {session.status === "OPEN" ? "Mark Attendance" : "View Record"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL 1: OPEN PRACTICE SESSION */}
      <Modal
        isOpen={isOpenModalOpen}
        onClose={() => setIsOpenModalOpen(false)}
        title="Open Practice Session"
        description="Select date and sport. Active athletes registered in this sport will be snapshotted into the session roster."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpenModalOpen(false)}
              disabled={isSubmittingOpen}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              isLoading={isSubmittingOpen}
              onClick={handleOpenSession}
              leftIcon={<Plus className="h-4 w-4" />}
            >
              Open Session
            </Button>
          </>
        }
      >
        <form onSubmit={handleOpenSession} className="space-y-3.5 text-left">
          {openError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {openError}
            </div>
          )}

          <Input
            label="Practice Date (YYYY-MM-DD)"
            type="date"
            required
            value={openDate}
            onChange={(e) => setOpenDate(e.target.value)}
          />

          <div className="space-y-1.5 text-left">
            <label className="block text-xs font-semibold tracking-wide text-brand-navy">
              Sport
            </label>
            <select
              value={openSport}
              onChange={(e) => setOpenSport(e.target.value)}
              className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
            >
              <option value="football">Football</option>
              <option value="cricket">Cricket</option>
              <option value="athletics">Athletics</option>
              <option value="badminton">Badminton</option>
            </select>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900 leading-relaxed">
            <p className="font-semibold">Roster Snapshot Rule:</p>
            <p className="mt-0.5">
              Opening this session immediately snapshots all currently active, verified players for{" "}
              {openSport.toUpperCase()}. Players registered later will not appear in this session.
            </p>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: CONFIRM CLOSE SESSION */}
      {isCloseModalOpen && activeSession && (
        <Modal
          isOpen={isCloseModalOpen}
          onClose={() => setIsCloseModalOpen(false)}
          title={`Lock Session: ${formatCalendarDate(activeSession.date)} (${activeSession.sport.toUpperCase()})`}
          description="Closing this session permanently locks attendance marks. It cannot be reopened or edited."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsCloseModalOpen(false)}
                disabled={isSubmittingClose}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmittingClose}
                onClick={handleCloseSession}
                leftIcon={<Lock className="h-4 w-4" />}
              >
                Confirm & Lock Session
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs text-slate-700 text-left">
            {closeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
                {closeError}
              </div>
            )}

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-1.5">
              <p>
                <strong>Sport:</strong> {activeSession.sport.toUpperCase()}
              </p>
              <p>
                <strong>Date:</strong> {formatCalendarDate(activeSession.date)}
              </p>
              <p>
                <strong>Total Roster:</strong> {totalRosterCount} athletes
              </p>
              <p>
                <strong>Present:</strong> {presentCount} athletes
              </p>
              <p>
                <strong>Absent:</strong> {absentCount} athletes
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 leading-relaxed">
              <p className="font-bold">Important Invariants:</p>
              <ul className="list-disc pl-4 mt-1 space-y-0.5">
                <li>Closed sessions are permanent and read-only.</li>
                <li>Only closed sessions count in player attendance denominators.</li>
                <li>
                  Only players marked Present in this closed session will be eligible for same-date
                  matches.
                </li>
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
