"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Clock,
  MapPin,
  Trophy,
  Activity,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import { PlayerNavbar } from "@/components/layout/player-navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingOverlay } from "@/components/ui/loading";
import { Modal } from "@/components/ui/modal";

interface ActivityItem {
  id: string;
  type: "TRAINING" | "MATCH";
  title: string;
  sport: string;
  date: string;
  time: string;
  endTime: string | null;
  venue: string;
  opponent: string | null;
  notes: string | null;
  status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
  cancelReason: string | null;
}

export default function PlayerCalendarPage() {
  const router = useRouter();
  const [playerData, setPlayerData] = React.useState<{
    player: { name: string; sport: string };
    readiness: { isReady: boolean };
    sessions: Array<unknown>;
    matches: Array<unknown>;
  } | null>(null);

  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [calendarFilter, setCalendarFilter] = React.useState<"ALL" | "TRAINING" | "MATCH">("ALL");
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityItem | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadActivities = React.useCallback(async () => {
    setIsActivitiesLoading(true);
    try {
      const res = await fetch("/api/activities?upcoming=true");
      if (res.ok) {
        const json = await res.json();
        setActivities(json.data.activities || []);
      }
    } catch {
      // ignore
    } finally {
      setIsActivitiesLoading(false);
    }
  }, []);

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
        setPlayerData(json.data);
      } else {
        setError(json.error?.message || "Failed to load player data");
      }
    } catch {
      setError("Network error loading player calendar.");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  React.useEffect(() => {
    loadProfile();
    loadActivities();
  }, [loadProfile, loadActivities]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <LoadingOverlay message="Loading upcoming schedule & calendar..." />
      </div>
    );
  }

  const player = playerData?.player;
  const ready = playerData?.readiness;
  const sessions = playerData?.sessions || [];
  const matches = playerData?.matches || [];

  const filteredActivities = activities.filter(
    (a) => calendarFilter === "ALL" || a.type === calendarFilter
  );

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B1120] text-brand-navy dark:text-[#F8FAFC]">
      <PlayerNavbar
        player={player}
        isReady={ready?.isReady}
        activitiesCount={activities.length}
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

        {/* Schedule Header Card */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-brand-navy tracking-tight flex items-center gap-2">
              <Calendar className="w-6 h-6 text-brand-primary" />
              <span>Upcoming Academy Activities</span>
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Official training sessions, tactical drills, and match fixtures scheduled by coaching staff
            </p>
          </div>

          {/* Type Filter */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold">
              {(["ALL", "TRAINING", "MATCH"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setCalendarFilter(t)}
                  className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                    calendarFilter === t
                      ? "bg-white text-brand-navy shadow-2xs font-black"
                      : "text-slate-500 hover:text-brand-navy"
                  }`}
                >
                  {t === "ALL" ? "All Schedule" : t === "TRAINING" ? "Trainings" : "Matches"}
                </button>
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadActivities}
              disabled={isActivitiesLoading}
              className="text-xs font-bold"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isActivitiesLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>

        {/* Activities Content */}
        {isActivitiesLoading ? (
          <div className="p-16 text-center bg-white rounded-2xl border border-slate-200">
            <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
            <p className="text-xs text-slate-500">Loading schedule...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-14 text-center">
            <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-brand-navy">No scheduled activities</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are currently no upcoming training drills or match fixtures in this category.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredActivities.map((act) => {
              const isMatch = act.type === "MATCH";
              const isCancelled = act.status === "CANCELLED";
              const isCompleted = act.status === "COMPLETED";

              return (
                <div
                  key={act.id}
                  onClick={() => setSelectedActivity(act)}
                  className={`rounded-2xl bg-white border p-5 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between gap-3 group ${
                    isCancelled
                      ? "border-slate-200 opacity-60 line-through"
                      : isMatch
                      ? "border-amber-200 hover:border-amber-300"
                      : "border-blue-200 hover:border-blue-300"
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-2.5">
                      <span
                        className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                          isMatch ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isMatch ? <Trophy className="w-3.5 h-3.5" /> : <Activity className="w-3.5 h-3.5" />}
                        {act.type} &bull; {act.sport}
                      </span>
                      <Badge
                        variant={
                          isCompleted
                            ? "success"
                            : isCancelled
                            ? "danger"
                            : "primary"
                        }
                      >
                        {act.status}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-brand-navy group-hover:text-brand-primary transition-colors">
                      {act.title}
                    </h4>
                    {isMatch && act.opponent && (
                      <p className="text-xs font-semibold text-amber-900 mt-1">
                        vs. {act.opponent}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 pt-3 border-t border-slate-100">
                    <div className="flex items-center gap-1 font-semibold text-slate-700">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>{act.time} {act.endTime ? `– ${act.endTime}` : ""}</span>
                    </div>
                    <div className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate max-w-[150px]">{act.venue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Read-Only Activity Details Modal for Player */}
        {selectedActivity && (
          <Modal
            isOpen={Boolean(selectedActivity)}
            onClose={() => setSelectedActivity(null)}
            title={
              selectedActivity.type === "MATCH"
                ? `Match Fixture: vs ${selectedActivity.opponent || "Opponent"}`
                : `Training Session: ${selectedActivity.title}`
            }
          >
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <span
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs ${
                    selectedActivity.type === "MATCH"
                      ? "bg-amber-100 text-amber-800"
                      : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {selectedActivity.type} &bull; {selectedActivity.sport.toUpperCase()}
                </span>
                <Badge
                  variant={
                    selectedActivity.status === "COMPLETED"
                      ? "success"
                      : selectedActivity.status === "CANCELLED"
                      ? "danger"
                      : "primary"
                  }
                >
                  {selectedActivity.status}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    Date & Time
                  </span>
                  <p className="font-bold text-brand-navy">
                    {selectedActivity.date} &bull; {selectedActivity.time}{" "}
                    {selectedActivity.endTime ? `– ${selectedActivity.endTime}` : ""}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                    Venue
                  </span>
                  <p className="font-bold text-brand-navy">{selectedActivity.venue}</p>
                </div>
              </div>

              {selectedActivity.type === "MATCH" && selectedActivity.opponent && (
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                  <span className="text-[10px] font-bold uppercase text-amber-700 block mb-0.5">
                    Opponent Team
                  </span>
                  <p className="font-bold text-amber-950 text-sm">{selectedActivity.opponent}</p>
                </div>
              )}

              {selectedActivity.notes && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Coach Instructions & Notes
                  </span>
                  <p className="text-slate-700 whitespace-pre-wrap">{selectedActivity.notes}</p>
                </div>
              )}

              {selectedActivity.status === "CANCELLED" && selectedActivity.cancelReason && (
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-800">
                  <span className="text-[10px] font-bold uppercase text-rose-600 block mb-1">
                    Cancellation Reason
                  </span>
                  <p className="font-medium">{selectedActivity.cancelReason}</p>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="outline" size="sm" onClick={() => setSelectedActivity(null)}>
                  Close
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </main>
    </div>
  );
}

