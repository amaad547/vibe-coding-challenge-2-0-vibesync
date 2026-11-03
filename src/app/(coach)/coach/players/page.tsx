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
import {
  Users,
  Clock,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Archive,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

interface PlayerItem {
  id: string;
  name: string;
  age: number;
  sport: string;
  isActive: boolean;
  registrationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  email: string | null;
  userAccountStatus: string | null;
  rejectionReason: string | null;
  createdAt: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export default function CoachPlayerManagementPage() {
  const router = useRouter();

  // Active Tab: "directory" vs "queue"
  const [activeTab, setActiveTab] = React.useState<"directory" | "queue">("directory");

  // Search & Filter State
  const [search, setSearch] = React.useState("");
  const [sportFilter, setSportFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"active" | "archived" | "all">("all");
  const [currentPage, setCurrentPage] = React.useState(1);

  // Data State
  const [players, setPlayers] = React.useState<PlayerItem[]>([]);
  const [pendingQueue, setPendingQueue] = React.useState<PlayerItem[]>([]);
  const [pagination, setPagination] = React.useState<PaginationInfo>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });

  // UI State
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [editingPlayer, setEditingPlayer] = React.useState<PlayerItem | null>(null);
  const [reviewingPlayer, setReviewingPlayer] = React.useState<PlayerItem | null>(null);
  const [reviewAction, setReviewAction] = React.useState<"APPROVE" | "REJECT">("APPROVE");
  const [rejectionReason, setRejectionReason] = React.useState("");
  const [archivingPlayer, setArchivingPlayer] = React.useState<PlayerItem | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // Add Player Form
  const [addName, setAddName] = React.useState("");
  const [addAge, setAddAge] = React.useState("");
  const [addSport, setAddSport] = React.useState("football");
  const [addEmail, setAddEmail] = React.useState("");
  const [addPassword, setAddPassword] = React.useState("");
  const [formError, setFormError] = React.useState<string | null>(null);

  // Edit Player Form
  const [editName, setEditName] = React.useState("");
  const [editAge, setEditAge] = React.useState("");
  const [editSport, setEditSport] = React.useState("");
  const [editIsActive, setEditIsActive] = React.useState(true);

  // Fetch Directory Players
  const fetchPlayers = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "10",
        status: statusFilter,
      });
      if (search) params.set("search", search);
      if (sportFilter) params.set("sport", sportFilter);

      const res = await fetch(`/api/players?${params.toString()}`);
      if (res.status === 401 || res.status === 403) {
        router.push("/login");
        return;
      }
      const json = await res.json();
      if (json.data) {
        setPlayers(json.data.players);
        setPagination(json.data.pagination);
      }
    } catch {
      setError("Failed to load player directory. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, statusFilter, search, sportFilter, router]);

  // Fetch Pending Queue
  const fetchPendingQueue = React.useCallback(async () => {
    try {
      const res = await fetch("/api/coach/registrations");
      if (res.ok) {
        const json = await res.json();
        setPendingQueue(json.data?.registrations || []);
      }
    } catch (err) {
      console.error("Failed to load pending queue:", err);
    }
  }, []);

  React.useEffect(() => {
    fetchPlayers();
    fetchPendingQueue();
  }, [fetchPlayers, fetchPendingQueue]);

  // Handle Add Player
  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      const res = await fetch("/api/players", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addName,
          age: parseInt(addAge, 10),
          sport: addSport,
          email: addEmail || undefined,
          temporaryPassword: addPassword || undefined,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setFormError(json.error?.message || "Failed to create player.");
        setIsSubmitting(false);
        return;
      }

      setIsAddModalOpen(false);
      setAddName("");
      setAddAge("");
      setAddEmail("");
      setAddPassword("");
      await fetchPlayers();
    } catch {
      setFormError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (p: PlayerItem) => {
    setEditingPlayer(p);
    setEditName(p.name);
    setEditAge(p.age.toString());
    setEditSport(p.sport);
    setEditIsActive(p.isActive);
  };

  // Handle Edit Player
  const handleEditPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlayer) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/players/${editingPlayer.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: editName,
          age: parseInt(editAge, 10),
          sport: editSport,
          isActive: editIsActive,
        }),
      });

      if (res.ok) {
        setEditingPlayer(null);
        await fetchPlayers();
      }
    } catch (err) {
      console.error("Failed to update player:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Archive Player
  const handleArchivePlayer = async () => {
    if (!archivingPlayer) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/players/${archivingPlayer.id}/archive`, {
        method: "POST",
      });

      if (res.ok) {
        setArchivingPlayer(null);
        await fetchPlayers();
      }
    } catch (err) {
      console.error("Failed to archive player:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Review (Approve / Reject)
  const handleReviewRegistration = async () => {
    if (!reviewingPlayer) return;
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/coach/registrations/${reviewingPlayer.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          decision: reviewAction,
          rejectionReason: reviewAction === "REJECT" ? rejectionReason : undefined,
        }),
      });

      if (res.ok) {
        setReviewingPlayer(null);
        setRejectionReason("");
        await fetchPendingQueue();
        await fetchPlayers();
      }
    } catch (err) {
      console.error("Failed to review registration:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AppShell title="Player Management" role="COACH">
      <div className="space-y-6">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-brand-navy">Player Management</h1>
            <p className="text-xs text-slate-500 mt-1">
              Maintain the Dumka Sports Academy roster, verify registrations, and manage athlete
              profiles.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                fetchPlayers();
                fetchPendingQueue();
              }}
              leftIcon={<RefreshCw className={`h-3.5 w-3.5 ${isLoading ? "animate-spin" : ""}`} />}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsAddModalOpen(true)}
            >
              Add Player
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab("directory")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "directory"
                ? "border-brand-primary text-brand-primary bg-blue-50/40"
                : "border-transparent text-slate-600 hover:text-brand-navy hover:bg-slate-50"
            }`}
          >
            <Users className="w-4 h-4" />
            Academy Directory ({pagination.total})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("queue")}
            className={`flex items-center gap-2 py-3 px-4 text-sm font-semibold border-b-2 transition-colors cursor-pointer ${
              activeTab === "queue"
                ? "border-brand-primary text-brand-primary bg-blue-50/40"
                : "border-transparent text-slate-600 hover:text-brand-navy hover:bg-slate-50"
            }`}
          >
            <Clock className="w-4 h-4 text-amber-500" />
            Registration Queue
            {pendingQueue.length > 0 && (
              <span className="ml-1 rounded-full bg-amber-500 text-white text-[10px] font-bold px-2 py-0.5">
                {pendingQueue.length}
              </span>
            )}
          </button>
        </div>

        {/* TAB 1: PLAYER DIRECTORY */}
        {activeTab === "directory" && (
          <Card>
            <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <CardTitle>Roster Directory</CardTitle>
                <CardDescription>
                  Active and archived players registered with Dumka Sports Academy.
                </CardDescription>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
                <div className="w-full sm:w-56">
                  <Input
                    placeholder="Search by name..."
                    value={search}
                    onChange={(e) => {
                      setSearch(e.target.value);
                      setCurrentPage(1);
                    }}
                    leftIcon={<Search className="h-4 w-4" />}
                  />
                </div>

                <select
                  value={sportFilter}
                  onChange={(e) => {
                    setSportFilter(e.target.value);
                    setCurrentPage(1);
                  }}
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
                  onChange={(e) => {
                    setStatusFilter(e.target.value as "active" | "archived" | "all");
                    setCurrentPage(1);
                  }}
                  className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-xs text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active Only</option>
                  <option value="archived">Archived Only</option>
                </select>
              </div>
            </CardHeader>

            <CardContent className="p-0">
              {error ? (
                <div className="p-8 text-center text-rose-600 text-xs">
                  <AlertTriangle className="w-6 h-6 mx-auto mb-2" />
                  <p className="font-semibold">{error}</p>
                  <Button variant="outline" size="sm" onClick={fetchPlayers} className="mt-3">
                    Retry
                  </Button>
                </div>
              ) : isLoading ? (
                <LoadingOverlay message="Loading players..." />
              ) : players.length === 0 ? (
                <TableEmpty
                  message="No players match the criteria."
                  description="Try adjusting your search query, sport filter, or status filter."
                />
              ) : (
                <>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Athlete</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Age</TableHead>
                        <TableHead>Sport</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {players.map((player) => (
                        <TableRow key={player.id}>
                          <TableCell className="font-bold text-brand-navy">{player.name}</TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {player.email || (
                              <span className="italic text-slate-400">No account</span>
                            )}
                          </TableCell>
                          <TableCell>{player.age} yrs</TableCell>
                          <TableCell>
                            <Badge variant="neutral">{player.sport.toUpperCase()}</Badge>
                          </TableCell>
                          <TableCell>
                            {player.isActive ? (
                              <Badge variant="success" dot>
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="neutral">Archived</Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {new Date(player.createdAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openEditModal(player)}
                                title="Edit Profile"
                              >
                                <Edit2 className="h-3.5 w-3.5 text-slate-600" />
                              </Button>
                              {player.isActive && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setArchivingPlayer(player)}
                                  title="Archive Player"
                                >
                                  <Archive className="h-3.5 w-3.5 text-slate-400 hover:text-rose-600" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>

                  {/* Pagination Footer */}
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-slate-100 gap-3 text-xs text-slate-600">
                    <div>
                      Showing <strong>{players.length}</strong> of{" "}
                      <strong>{pagination.total}</strong> players
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasPrevPage}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        leftIcon={<ChevronLeft className="h-4 w-4" />}
                      >
                        Previous
                      </Button>
                      <span className="px-2 font-medium">
                        Page {pagination.page} of {pagination.totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={!pagination.hasNextPage}
                        onClick={() => setCurrentPage((p) => p + 1)}
                        rightIcon={<ChevronRight className="h-4 w-4" />}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* TAB 2: REGISTRATION REVIEW QUEUE */}
        {activeTab === "queue" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" />
                Pending Verification Queue ({pendingQueue.length})
              </CardTitle>
              <CardDescription>
                Review public self-registrations. Approving activates the account and allows player
                login.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {pendingQueue.length === 0 ? (
                <TableEmpty
                  message="No pending applications awaiting verification."
                  description="When new players register via the public portal, their profiles will appear here for coach review."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Applicant</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Age</TableHead>
                      <TableHead>Primary Sport</TableHead>
                      <TableHead>Applied On</TableHead>
                      <TableHead className="text-right">Decision</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingQueue.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-bold text-brand-navy">{item.name}</TableCell>
                        <TableCell className="text-slate-600">{item.email}</TableCell>
                        <TableCell>{item.age} yrs</TableCell>
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
                                setReviewingPlayer(item);
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
                                setReviewingPlayer(item);
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
        )}
      </div>

      {/* MODAL 1: ADD PLAYER */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Player"
        description="Directly register an academy athlete. Coach-created athletes are verified immediately."
        footer={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" isLoading={isSubmitting} onClick={handleAddPlayer}>
              Save Player
            </Button>
          </>
        }
      >
        <form onSubmit={handleAddPlayer} className="space-y-3.5">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
              {formError}
            </div>
          )}

          <Input
            label="Full Name"
            required
            placeholder="e.g. Sunil Soren"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Age (5 - 100)"
              type="number"
              min="5"
              max="100"
              required
              placeholder="16"
              value={addAge}
              onChange={(e) => setAddAge(e.target.value)}
            />

            <div className="space-y-1.5 text-left">
              <label className="block text-xs font-semibold tracking-wide text-brand-navy">
                Primary Sport
              </label>
              <select
                value={addSport}
                onChange={(e) => setAddSport(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
              >
                <option value="football">Football</option>
                <option value="cricket">Cricket</option>
                <option value="athletics">Athletics</option>
                <option value="badminton">Badminton</option>
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
              Optional Player Portal Account
            </p>
            <Input
              label="Account Email (Optional)"
              type="email"
              placeholder="player@dumkasports.org"
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              helperText="If specified, creates a linked user account for player self-service access."
            />
          </div>

          {addEmail && (
            <Input
              label="Initial Password"
              type="password"
              placeholder="Defaults to SportSync123! if blank"
              value={addPassword}
              onChange={(e) => setAddPassword(e.target.value)}
            />
          )}
        </form>
      </Modal>

      {/* MODAL 2: EDIT PLAYER */}
      {editingPlayer && (
        <Modal
          isOpen={!!editingPlayer}
          onClose={() => setEditingPlayer(null)}
          title={`Edit Profile: ${editingPlayer.name}`}
          description="Update athlete details. Changes take effect across attendance sessions and matches."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingPlayer(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleEditPlayer}
              >
                Update Profile
              </Button>
            </>
          }
        >
          <form onSubmit={handleEditPlayer} className="space-y-3.5">
            <Input
              label="Full Name"
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Age"
                type="number"
                min="5"
                max="100"
                required
                value={editAge}
                onChange={(e) => setEditAge(e.target.value)}
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-semibold tracking-wide text-brand-navy">
                  Sport
                </label>
                <select
                  value={editSport}
                  onChange={(e) => setEditSport(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-brand-navy focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                >
                  <option value="football">Football</option>
                  <option value="cricket">Cricket</option>
                  <option value="athletics">Athletics</option>
                  <option value="badminton">Badminton</option>
                </select>
              </div>
            </div>

            <div className="pt-2 flex items-center gap-2">
              <input
                id="editIsActive"
                type="checkbox"
                checked={editIsActive}
                onChange={(e) => setEditIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-primary focus:ring-brand-primary/20"
              />
              <label
                htmlFor="editIsActive"
                className="text-xs font-semibold text-brand-navy cursor-pointer"
              >
                Player is Active (Active players appear in new practice session rosters)
              </label>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL 3: ARCHIVE PLAYER CONFIRMATION */}
      {archivingPlayer && (
        <Modal
          isOpen={!!archivingPlayer}
          onClose={() => setArchivingPlayer(null)}
          title={`Archive ${archivingPlayer.name}?`}
          description="Archiving sets the player to inactive. Historical attendance and match records are permanently preserved."
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setArchivingPlayer(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                isLoading={isSubmitting}
                onClick={handleArchivePlayer}
              >
                Archive Athlete
              </Button>
            </>
          }
        >
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-800 space-y-1">
            <p>
              <strong>Athlete:</strong> {archivingPlayer.name} (
              {archivingPlayer.sport.toUpperCase()})
            </p>
            <p>
              Archived athletes will not be included in newly opened practice sessions, but their
              past records remain in academy analytics.
            </p>
          </div>
        </Modal>
      )}

      {/* MODAL 4: REVIEW REGISTRATION (APPROVE / REJECT) */}
      {reviewingPlayer && (
        <Modal
          isOpen={!!reviewingPlayer}
          onClose={() => setReviewingPlayer(null)}
          title={
            reviewAction === "APPROVE"
              ? `Approve ${reviewingPlayer.name}`
              : `Reject Application: ${reviewingPlayer.name}`
          }
          description={
            reviewAction === "APPROVE"
              ? "Approving activates the player profile and grants portal login access."
              : "Rejecting denies portal login."
          }
          footer={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setReviewingPlayer(null)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant={reviewAction === "APPROVE" ? "primary" : "danger"}
                size="sm"
                isLoading={isSubmitting}
                onClick={handleReviewRegistration}
              >
                {reviewAction === "APPROVE" ? "Confirm Approval" : "Confirm Rejection"}
              </Button>
            </>
          }
        >
          <div className="space-y-3 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <p>
                <strong>Applicant:</strong> {reviewingPlayer.name} ({reviewingPlayer.age} yrs)
              </p>
              <p>
                <strong>Email:</strong> {reviewingPlayer.email}
              </p>
              <p>
                <strong>Sport:</strong> {reviewingPlayer.sport.toUpperCase()}
              </p>
            </div>

            {reviewAction === "REJECT" && (
              <div className="space-y-1.5 pt-2">
                <label className="font-semibold text-brand-navy">
                  Rejection Reason (Optional):
                </label>
                <input
                  type="text"
                  placeholder="e.g. Incomplete age documentation"
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
