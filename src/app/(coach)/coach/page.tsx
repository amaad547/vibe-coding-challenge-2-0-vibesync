"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { Modal } from "@/components/ui/modal";
import {
  Users,
  Clock,
  CalendarCheck,
  Trophy,
  ShieldCheck,
  Plus,
  RefreshCw,
  ArrowRight,
  Check,
  X,
  AlertTriangle,
} from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/date";

interface OverviewData {
  playerStats: {
    totalActive: number;
    totalPending: number;
    totalArchived: number;
    totalVerified: number;
    readyForScouts: number;
  };
  pendingRegistrations: Array<{
    id: string;
    name: string;
    age: number;
    sport: string;
    createdAt: string;
  }>;
  sessionStats: {
    totalSessions: number;
    closedSessions: number;
    openSessions: number;
  };
  recentSessions: Array<{
    id: string;
    date: string;
    sport: string;
    status: "OPEN" | "CLOSED";
    totalRoster: number;
    presentCount: number;
  }>;
  matchStats: {
    totalMatches: number;
  };
  recentMatches: Array<{
    id: string;
    date: string;
    sport: string;
    opponent: string;
    totalParticipants: number;
  }>;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const [data, setData] = React.useState<OverviewData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Review modal state
  const [selectedPlayer, setSelectedPlayer] = React.useState<{
    id: string;
    name: string;
    sport: string;
  } | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isSubmittingReview, setIsSubmittingReview] = React.useState(false);

  const fetchOverview = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/coach/overview");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data) {
        setData(json.data);
      }
    } catch {
      setError("Failed to load coach overview statistics.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  const handleReview = async () => {
    if (!selectedPlayer) return;
    setIsSubmittingReview(true);

    try {
      const res = await fetch(`/api/coach/registrations/${selectedPlayer.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewAction,
          rejectionReason: reviewAction === "REJECT" ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        setSelectedPlayer(null);
        setRejectionReason("");
        await fetchOverview();
      }
    } catch (err) {
      console.error("Failed to review registration:", err);
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const pStats = data?.playerStats || {
    totalActive: 0,
    totalPending: 0,
    totalArchived: 0,
    totalVerified: 0,
    readyForScouts: 0,
  };
  const sStats = data?.sessionStats || { totalSessions: 0, closedSessions: 0, openSessions: 0 };
  const mStats = data?.matchStats || { totalMatches: 0 };

  return (
    <AppShell title="Coach Management Desk" role="COACH">
      <div className="space-y-6">
        {/* Banner with Quick Action Buttons */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-brand-navy">Dumka Sports Academy</h1>
              <Badge variant="primary">Coach Console</Badge>
            </div>
            <p className="mt-1 text-sm text-slate-600">
              Manage enrolled athletes, attendance sessions, match fixtures, and scout-ready talent.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchOverview}
              leftIcon={<RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Link href="/coach/players">
              <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                Add Athlete
              </Button>
            </Link>
            <Link href="/coach/sessions">
              <Button variant="outline" size="sm" leftIcon={<CalendarCheck className="w-4 h-4" />}>
                Sessions
              </Button>
            </Link>
          </div>
        </div>

        {error && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 4 Primary KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Active Athletes */}
          <Link href="/coach/players" className="block group">
            <Card className="hover:border-brand-primary/50 transition-all border-l-4 border-l-brand-primary">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                    Active Athletes
                  </CardDescription>
                  <Users className="w-4 h-4 text-brand-primary group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl font-black text-brand-navy">
                  {pStats.totalVerified}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Verified academy roster</p>
              </CardContent>
            </Card>
          </Link>

          {/* Pending Registrations */}
          <Link href="/coach/players" className="block group">
            <Card className="hover:border-amber-400 transition-all border-l-4 border-l-amber-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                    Pending Verification
                  </CardDescription>
                  <Clock className="w-4 h-4 text-amber-500 group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl font-black text-amber-600">
                  {pStats.totalPending}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Awaiting coach review</p>
              </CardContent>
            </Card>
          </Link>

          {/* Closed Sessions */}
          <Link href="/coach/sessions" className="block group">
            <Card className="hover:border-blue-400 transition-all border-l-4 border-l-blue-500">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                    Practice Sessions
                  </CardDescription>
                  <CalendarCheck className="w-4 h-4 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl font-black text-brand-navy">
                  {sStats.closedSessions}{" "}
                  <span className="text-xs text-slate-400 font-normal">
                    / {sStats.totalSessions}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">
                  {sStats.openSessions > 0
                    ? `${sStats.openSessions} open session(s)`
                    : "All closed"}
                </p>
              </CardContent>
            </Card>
          </Link>

          {/* Ready For Scouts */}
          <Link href="/coach/readiness" className="block group">
            <Card className="hover:border-emerald-400 transition-all border-l-4 border-l-emerald-500 bg-emerald-50/20">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardDescription className="text-xs uppercase font-semibold text-slate-500">
                    Ready for Scouts
                  </CardDescription>
                  <ShieldCheck className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
                </div>
                <CardTitle className="text-2xl font-black text-emerald-600">
                  {pStats.readyForScouts}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-slate-500">Satisfies trial requirements</p>
              </CardContent>
            </Card>
          </Link>
        </div>

        {/* Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Column 1: Pending Athlete Registrations Queue */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  Athlete Registration Queue
                </CardTitle>
                <CardDescription>
                  Athletes awaiting coach verification to activate their account
                </CardDescription>
              </div>
              <Link href="/coach/players">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  View All
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Athlete</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6 text-slate-400 text-xs">
                        Loading queue...
                      </TableCell>
                    </TableRow>
                  ) : !data?.pendingRegistrations || data.pendingRegistrations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4}>
                        <TableEmpty
                          message="No pending registrations"
                          description="All athlete registrations have been reviewed."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    data.pendingRegistrations.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell>
                          <div className="font-semibold text-slate-800 text-xs">{p.name}</div>
                          <div className="text-[11px] text-slate-400">{p.age} years old</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="neutral" className="uppercase text-[10px]">
                            {p.sport}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-slate-500">
                          {formatCalendarDate(p.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPlayer({ id: p.id, name: p.name, sport: p.sport });
                              setReviewAction("APPROVE");
                            }}
                          >
                            Review
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Column 2: Recent Sessions & Matches */}
          <div className="space-y-6">
            {/* Recent Practice Sessions */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-blue-600" />
                    Recent Practice Sessions
                  </CardTitle>
                  <CardDescription>Latest opened and finalized attendance sessions</CardDescription>
                </div>
                <Link href="/coach/sessions">
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Sessions
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Attendance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!data?.recentSessions || data.recentSessions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <TableEmpty message="No recent practice sessions" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentSessions.map((s) => (
                        <TableRow key={s.id}>
                          <TableCell className="font-semibold text-xs text-slate-800">
                            {formatCalendarDate(s.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral" className="uppercase text-[10px]">
                              {s.sport}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {s.status === "CLOSED" ? (
                              <Badge variant="neutral">Closed & Locked</Badge>
                            ) : (
                              <Badge variant="info" dot>
                                Open
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-right text-xs font-semibold text-brand-navy">
                            {s.presentCount} / {s.totalRoster} Present
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Recent Finalized Matches */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-500" />
                    Recent Match Fixtures ({mStats.totalMatches})
                  </CardTitle>
                  <CardDescription>
                    Official finalized match fixtures with recorded scores
                  </CardDescription>
                </div>
                <Link href="/coach/matches">
                  <Button
                    variant="ghost"
                    size="sm"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                  >
                    Matches
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Sport</TableHead>
                      <TableHead>Opponent</TableHead>
                      <TableHead className="text-right">Athletes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {!data?.recentMatches || data.recentMatches.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <TableEmpty message="No match fixtures recorded yet" />
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentMatches.map((m) => (
                        <TableRow key={m.id}>
                          <TableCell className="font-semibold text-xs text-slate-800">
                            {formatCalendarDate(m.date)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="neutral" className="uppercase text-[10px]">
                              {m.sport}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-xs text-brand-navy">
                            vs. {m.opponent}
                          </TableCell>
                          <TableCell className="text-right text-xs font-bold text-slate-600">
                            {m.totalParticipants} Athletes
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Review Modal */}
        <Modal
          isOpen={Boolean(selectedPlayer)}
          onClose={() => setSelectedPlayer(null)}
          title={`Review Application: ${selectedPlayer?.name}`}
          description={`Sport: ${selectedPlayer?.sport.toUpperCase()} &bull; Decide whether to approve or reject this athlete.`}
        >
          {selectedPlayer && (
            <div className="space-y-4 pt-2">
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="decision"
                    checked={reviewAction === "APPROVE"}
                    onChange={() => setReviewAction("APPROVE")}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Approve (Activate Account)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="radio"
                    name="decision"
                    checked={reviewAction === "REJECT"}
                    onChange={() => setReviewAction("REJECT")}
                    className="text-rose-600 focus:ring-rose-500"
                  />
                  <span>Reject</span>
                </label>
              </div>

              {reviewAction === "REJECT" && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Rejection Reason
                  </label>
                  <textarea
                    rows={3}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Provide reason for rejecting application..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-xs text-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                    required
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <Button variant="outline" size="sm" onClick={() => setSelectedPlayer(null)}>
                  Cancel
                </Button>
                <Button
                  variant={reviewAction === "APPROVE" ? "primary" : "danger"}
                  size="sm"
                  onClick={handleReview}
                  isLoading={isSubmittingReview}
                  leftIcon={
                    reviewAction === "APPROVE" ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <X className="w-4 h-4" />
                    )
                  }
                >
                  Confirm {reviewAction === "APPROVE" ? "Approval" : "Rejection"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AppShell>
  );
}
