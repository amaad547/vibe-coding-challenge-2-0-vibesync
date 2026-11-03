"use client";

import * as React from "react";
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
import { Users, Clock, Check, X, Shield, RefreshCw } from "lucide-react";

interface PendingRegistration {
  id: string;
  name: string;
  age: number;
  sport: string;
  email: string;
  registrationStatus: string;
  createdAt: string;
}

export default function CoachDashboardPage() {
  const router = useRouter();
  const [registrations, setRegistrations] = React.useState<PendingRegistration[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [selectedPlayer, setSelectedPlayer] = React.useState<PendingRegistration | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const fetchRegistrations = React.useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/coach/registrations");
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const data = await res.json();
      if (data.data?.registrations) {
        setRegistrations(data.data.registrations);
      }
    } catch (err) {
      console.error("Failed to load registrations:", err);
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleReview = async () => {
    if (!selectedPlayer) return;
    setIsSubmitting(true);

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
        await fetchRegistrations();
      }
    } catch (err) {
      console.error("Failed to review registration:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  return (
    <AppShell title="Coach Management Desk" role="COACH">
      <div className="space-y-6">
        {/* Coach Header banner */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-xl border border-blue-100 bg-linear-to-r from-blue-50 to-white p-6 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-extrabold text-brand-navy">Coach Desk</h2>
              <Badge variant="primary" dot>
                Authorized Coach
              </Badge>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              Dumka Sports Academy &bull; Manage players, attendance sessions, match records, and
              registration requests.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchRegistrations}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button variant="danger" size="sm" onClick={handleLogout}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Pending Player Registration Queue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Player Registration Queue ({registrations.length})
              </CardTitle>
              <CardDescription>
                Public player self-registrations require coach verification before account
                activation.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {registrations.length === 0 ? (
              <TableEmpty
                message="No pending player registrations."
                description="When new players register, their applications will appear here for review."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Sport</TableHead>
                    <TableHead>Applied On</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-bold text-brand-navy">{item.name}</TableCell>
                      <TableCell className="text-slate-600">{item.email}</TableCell>
                      <TableCell>{item.age}</TableCell>
                      <TableCell>
                        <Badge variant="neutral">{item.sport.toUpperCase()}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="primary"
                            size="sm"
                            leftIcon={<Check className="h-3.5 w-3.5" />}
                            onClick={() => {
                              setSelectedPlayer(item);
                              setReviewAction("APPROVE");
                            }}
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            leftIcon={<X className="h-3.5 w-3.5 text-rose-500" />}
                            onClick={() => {
                              setSelectedPlayer(item);
                              setReviewAction("REJECT");
                            }}
                          >
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Quick Reference Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-brand-primary flex items-center justify-center mb-4">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-navy">Player Directory</h3>
              <p className="text-xs text-slate-500 mt-1">
                Active players in Football, Cricket, and other registered academy sports.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-brand-navy">Access Control Active</h3>
              <p className="text-xs text-slate-500 mt-1">
                Strict role enforcement: Players see only own data; Scouts see Ready talent only.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Approve/Reject Modal */}
      {selectedPlayer && (
        <Modal
          isOpen={!!selectedPlayer}
          onClose={() => setSelectedPlayer(null)}
          title={
            reviewAction === "APPROVE"
              ? `Approve ${selectedPlayer.name}`
              : `Reject Registration: ${selectedPlayer.name}`
          }
          description={
            reviewAction === "APPROVE"
              ? "Approving this registration will activate the player profile and allow the player to log in."
              : "Rejecting this registration will prevent the account from logging in."
          }
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedPlayer(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === "APPROVE" ? "primary" : "danger"}
                size="sm"
                isLoading={isSubmitting}
                onClick={handleReview}
              >
                {reviewAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <p>
                <strong>Applicant:</strong> {selectedPlayer.name} (Age {selectedPlayer.age})
              </p>
              <p>
                <strong>Email:</strong> {selectedPlayer.email}
              </p>
              <p>
                <strong>Sport:</strong> {selectedPlayer.sport.toUpperCase()}
              </p>
            </div>

            {reviewAction === "REJECT" && (
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-brand-navy">
                  Rejection Reason (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incomplete verification or age requirement"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full h-9 rounded-lg border border-slate-300 px-3 text-xs"
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
