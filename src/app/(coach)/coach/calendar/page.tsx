"use client";

import * as React from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trophy,
  Activity as ActivityIcon,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Filter,
  Search,
  ExternalLink,
  Edit2,
  Trash2,
  Ban,
  CalendarDays,
  RefreshCw,
} from "lucide-react";
import { formatCalendarDate } from "@/lib/utils/date";

export type CalendarViewMode = "month" | "week" | "day" | "list";
export type ActivityType = "TRAINING" | "MATCH";
export type ActivityStatus = "SCHEDULED" | "COMPLETED" | "CANCELLED";

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  sport: string;
  date: string; // YYYY-MM-DD
  rawDate: string;
  time: string; // HH:mm
  endTime: string | null;
  venue: string;
  opponent: string | null;
  notes: string | null;
  status: ActivityStatus;
  sessionId: string | null;
  sessionInfo: {
    id: string;
    status: "OPEN" | "CLOSED";
    totalRoster: number;
    closedAt: string | null;
  } | null;
  matchId: string | null;
  matchInfo: {
    id: string;
    status: string;
    opponent: string;
    participantsCount: number;
  } | null;
  cancelReason: string | null;
  cancelledAt: string | null;
}

const AVAILABLE_SPORTS = [
  { id: "all", label: "All Sports" },
  { id: "football", label: "Football" },
  { id: "cricket", label: "Cricket" },
  { id: "athletics", label: "Athletics" },
  { id: "badminton", label: "Badminton" },
];

export default function CoachCalendarPage() {
  const [viewMode, setViewMode] = React.useState<CalendarViewMode>("month");
  const [currentDate, setCurrentDate] = React.useState<Date>(new Date());
  const [selectedSport, setSelectedSport] = React.useState<string>("all");
  const [selectedType, setSelectedType] = React.useState<string>("ALL");
  const [searchQuery, setSearchQuery] = React.useState<string>("");

  const [activities, setActivities] = React.useState<ActivityItem[]>([]);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successMessage, setSuccessMessage] = React.useState<string | null>(null);

  // Modals
  const [selectedActivity, setSelectedActivity] = React.useState<ActivityItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = React.useState<boolean>(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState<boolean>(false);
  const [createType, setCreateType] = React.useState<ActivityType>("TRAINING");
  const [isEditModalOpen, setIsEditModalOpen] = React.useState<boolean>(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = React.useState<boolean>(false);
  const [cancelReasonInput, setCancelReasonInput] = React.useState<string>("");

  // Create Form State
  const [formTitle, setFormTitle] = React.useState<string>("");
  const [formSport, setFormSport] = React.useState<string>("football");
  const [formDate, setFormDate] = React.useState<string>(formatCalendarDate(new Date()));
  const [formTime, setFormTime] = React.useState<string>("06:30");
  const [formEndTime, setFormEndTime] = React.useState<string>("08:30");
  const [formVenue, setFormVenue] = React.useState<string>("Dumka Sports Complex");
  const [formOpponent, setFormOpponent] = React.useState<string>("");
  const [formNotes, setFormNotes] = React.useState<string>("");
  const [formSubmitting, setFormSubmitting] = React.useState<boolean>(false);

  // Fetch Activities
  const fetchActivities = React.useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      // Determine query date range based on active view mode
      let url = "/api/activities?";
      const params = new URLSearchParams();

      if (selectedSport !== "all") {
        params.append("sport", selectedSport);
      }
      if (selectedType !== "ALL") {
        params.append("type", selectedType);
      }

      if (viewMode === "month") {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const firstDay = new Date(year, month - 1, 20); // include padding days
        const lastDay = new Date(year, month + 1, 10);
        params.append("start", formatCalendarDate(firstDay));
        params.append("end", formatCalendarDate(lastDay));
      } else if (viewMode === "week") {
        const dayOfWeek = currentDate.getDay();
        const startOfWeek = new Date(currentDate);
        startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        params.append("start", formatCalendarDate(startOfWeek));
        params.append("end", formatCalendarDate(endOfWeek));
      } else if (viewMode === "day") {
        params.append("start", formatCalendarDate(currentDate));
        params.append("end", formatCalendarDate(currentDate));
      } else {
        // list view -> upcoming
        params.append("upcoming", "true");
      }

      url += params.toString();
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error("Failed to load activities");
      }
      const json = await res.json();
      setActivities(json.data.activities || []);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error fetching calendar schedule");
    } finally {
      setIsLoading(false);
    }
  }, [currentDate, viewMode, selectedSport, selectedType]);

  React.useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Calendar Navigation
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() - 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() - 7);
    } else if (viewMode === "day") {
      next.setDate(next.getDate() - 1);
    }
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === "month") {
      next.setMonth(next.getMonth() + 1);
    } else if (viewMode === "week") {
      next.setDate(next.getDate() + 7);
    } else if (viewMode === "day") {
      next.setDate(next.getDate() + 1);
    }
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open Create Modal
  const openCreateModal = (type: ActivityType, defaultDate?: string) => {
    setCreateType(type);
    setFormTitle(
      type === "TRAINING"
        ? "Morning Tactical & Conditioning Session"
        : "Tournament Match vs Opponent"
    );
    setFormSport(selectedSport !== "all" ? selectedSport : "football");
    setFormDate(defaultDate || formatCalendarDate(currentDate));
    setFormTime(type === "TRAINING" ? "06:30" : "15:30");
    setFormEndTime(type === "TRAINING" ? "08:30" : "17:30");
    setFormVenue("Dumka Sports Complex Main Ground");
    setFormOpponent("");
    setFormNotes("");
    setIsCreateModalOpen(true);
  };

  // Submit Create Activity
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const payload = {
        type: createType,
        title: formTitle,
        sport: formSport,
        date: formDate,
        time: formTime,
        endTime: formEndTime || undefined,
        venue: formVenue,
        opponent: createType === "MATCH" ? formOpponent : undefined,
        notes: formNotes || undefined,
      };

      const res = await fetch("/api/activities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to schedule activity");
      }

      setIsCreateModalOpen(false);
      setSuccessMessage(
        `${createType === "MATCH" ? "Match" : "Training session"} scheduled successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchActivities();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error creating activity");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Open Edit Modal
  const openEditModal = (act: ActivityItem) => {
    setSelectedActivity(act);
    setFormTitle(act.title);
    setFormSport(act.sport);
    setFormDate(act.date);
    setFormTime(act.time);
    setFormEndTime(act.endTime || "");
    setFormVenue(act.venue);
    setFormOpponent(act.opponent || "");
    setFormNotes(act.notes || "");
    setIsDetailModalOpen(false);
    setIsEditModalOpen(true);
  };

  // Submit Edit Activity
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    setFormSubmitting(true);

    try {
      const payload = {
        title: formTitle,
        sport: formSport,
        date: formDate,
        time: formTime,
        endTime: formEndTime || undefined,
        venue: formVenue,
        opponent: selectedActivity.type === "MATCH" ? formOpponent : undefined,
        notes: formNotes || undefined,
      };

      const res = await fetch(`/api/activities/${selectedActivity.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to update activity");
      }

      setIsEditModalOpen(false);
      setSuccessMessage("Activity updated successfully!");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchActivities();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error updating activity");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Cancel Activity
  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    setFormSubmitting(true);

    try {
      const res = await fetch(`/api/activities/${selectedActivity.id}/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: cancelReasonInput }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || "Failed to cancel activity");
      }

      setIsCancelModalOpen(false);
      setIsDetailModalOpen(false);
      setSuccessMessage("Activity marked as CANCELLED.");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchActivities();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error cancelling activity");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete Activity
  const handleDeleteActivity = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this scheduled activity?")) return;
    try {
      const res = await fetch(`/api/activities/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || "Failed to delete");
      }
      setIsDetailModalOpen(false);
      setSuccessMessage("Activity deleted successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
      fetchActivities();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to delete activity");
    }
  };

  // Render Month Grid
  const renderMonthGrid = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const todayStr = formatCalendarDate(new Date());

    const days: Array<{
      dateStr: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: ActivityItem[];
    }> = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevDate = new Date(year, month - 1, d);
      const dateStr = formatCalendarDate(prevDate);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: activities.filter((a) => a.date === dateStr),
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const thisDate = new Date(year, month, d);
      const dateStr = formatCalendarDate(thisDate);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: activities.filter((a) => a.date === dateStr),
      });
    }

    // Next month padding to fill 35 or 42 grid cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const nextDate = new Date(year, month + 1, d);
      const dateStr = formatCalendarDate(nextDate);
      days.push({
        dateStr,
        dayNumber: d,
        isCurrentMonth: false,
        isToday: dateStr === todayStr,
        events: activities.filter((a) => a.date === dateStr),
      });
    }

    return (
      <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
        {/* Day Header */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50 text-center text-xs font-bold text-slate-600 py-3">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-slate-100">
          {days.map((cell, idx) => (
            <div
              key={idx}
              className={`min-h-[110px] sm:min-h-[125px] p-1.5 sm:p-2 flex flex-col justify-between transition-colors ${
                cell.isCurrentMonth ? "bg-white" : "bg-slate-50/60 text-slate-400"
              } ${cell.isToday ? "ring-2 ring-inset ring-brand-primary/40 bg-blue-50/30" : ""}`}
            >
              {/* Day header with click to add */}
              <div className="flex items-center justify-between mb-1">
                <span
                  className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                    cell.isToday
                      ? "bg-brand-primary text-white"
                      : cell.isCurrentMonth
                      ? "text-slate-700"
                      : "text-slate-400"
                  }`}
                >
                  {cell.dayNumber}
                </span>

                {cell.isCurrentMonth && (
                  <button
                    type="button"
                    onClick={() => openCreateModal("TRAINING", cell.dateStr)}
                    className="opacity-0 group-hover:opacity-100 hover:opacity-100 text-slate-400 hover:text-brand-primary text-[10px] font-bold p-0.5 rounded transition-opacity"
                    title={`Add activity on ${cell.dateStr}`}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Event chips */}
              <div className="space-y-1 flex-1 overflow-y-auto max-h-[85px] scrollbar-thin">
                {cell.events.slice(0, 3).map((act) => {
                  const isMatch = act.type === "MATCH";
                  const isCancelled = act.status === "CANCELLED";
                  const isCompleted = act.status === "COMPLETED";

                  return (
                    <button
                      key={act.id}
                      type="button"
                      onClick={() => {
                        setSelectedActivity(act);
                        setIsDetailModalOpen(true);
                      }}
                      className={`w-full text-left rounded-md px-1.5 py-1 text-[11px] font-semibold truncate transition-all flex items-center gap-1.5 ${
                        isCancelled
                          ? "bg-slate-100 text-slate-500 line-through opacity-70"
                          : isMatch
                          ? isCompleted
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                            : "bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100"
                          : isCompleted
                          ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                          : "bg-blue-50 text-blue-900 border border-blue-200 hover:bg-blue-100"
                      }`}
                      title={`${act.time} - ${act.title} (${act.status})`}
                    >
                      {isMatch ? (
                        <Trophy className="w-3 h-3 text-amber-600 shrink-0" />
                      ) : (
                        <ActivityIcon className="w-3 h-3 text-blue-600 shrink-0" />
                      )}
                      <span className="font-bold shrink-0">{act.time}</span>
                      <span className="truncate">
                        {isMatch ? `vs ${act.opponent || "Opponent"}` : act.title}
                      </span>
                    </button>
                  );
                })}

                {cell.events.length > 3 && (
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentDate(new Date(cell.dateStr));
                      setViewMode("day");
                    }}
                    className="text-[10px] font-bold text-brand-primary hover:underline block text-center w-full pt-0.5"
                  >
                    +{cell.events.length - 3} more
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render Week View
  const renderWeekView = () => {
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);

    const weekDays: Array<{
      name: string;
      dateStr: string;
      dayNumber: number;
      isToday: boolean;
      events: ActivityItem[];
    }> = [];

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayStr = formatCalendarDate(new Date());

    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      const dateStr = formatCalendarDate(d);
      weekDays.push({
        name: dayNames[i] || "",
        dateStr,
        dayNumber: d.getDate(),
        isToday: dateStr === todayStr,
        events: activities.filter((a) => a.date === dateStr),
      });
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
        {weekDays.map((col, idx) => (
          <div
            key={idx}
            className={`rounded-2xl border p-3 flex flex-col min-h-[380px] bg-white shadow-xs ${
              col.isToday ? "border-brand-primary ring-2 ring-brand-primary/20" : "border-slate-200"
            }`}
          >
            <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  {col.name.slice(0, 3)}
                </span>
                <h4
                  className={`text-base font-black ${
                    col.isToday ? "text-brand-primary" : "text-brand-navy"
                  }`}
                >
                  {col.dayNumber}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => openCreateModal("TRAINING", col.dateStr)}
                className="rounded-lg p-1 text-slate-400 hover:text-brand-primary hover:bg-blue-50 transition-colors"
                title={`Schedule on ${col.dateStr}`}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 flex-1 overflow-y-auto">
              {col.events.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-4">
                  <p className="text-[11px] text-slate-400">No activities</p>
                </div>
              ) : (
                col.events.map((act) => {
                  const isMatch = act.type === "MATCH";
                  const isCancelled = act.status === "CANCELLED";

                  return (
                    <div
                      key={act.id}
                      onClick={() => {
                        setSelectedActivity(act);
                        setIsDetailModalOpen(true);
                      }}
                      className={`rounded-xl p-2.5 border text-xs cursor-pointer transition-all hover:shadow-md ${
                        isCancelled
                          ? "bg-slate-50 border-slate-200 opacity-60 line-through"
                          : isMatch
                          ? "bg-amber-50/70 border-amber-200 hover:border-amber-300"
                          : "bg-blue-50/70 border-blue-200 hover:border-blue-300"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                            isMatch ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {isMatch ? <Trophy className="w-3 h-3" /> : <ActivityIcon className="w-3 h-3" />}
                          {act.type}
                        </span>
                        <span className="text-[10px] font-bold text-slate-600">{act.time}</span>
                      </div>
                      <h5 className="font-bold text-brand-navy truncate">{act.title}</h5>
                      {isMatch && act.opponent && (
                        <p className="text-[11px] text-amber-900 font-semibold truncate mt-0.5">
                          vs {act.opponent}
                        </p>
                      )}
                      <p className="text-[10px] text-slate-500 capitalize mt-1">
                        {act.sport} &bull; {act.venue}
                      </p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  // Render Day View
  const renderDayView = () => {
    const dateStr = formatCalendarDate(currentDate);
    const dayEvents = activities.filter((a) => a.date === dateStr);

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between rounded-2xl bg-white border border-slate-200 p-4 shadow-xs">
          <div>
            <h3 className="text-lg font-black text-brand-navy">
              Schedule for {currentDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {dayEvents.length} activities scheduled for this date
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => openCreateModal("TRAINING", dateStr)}>
              <Plus className="w-3.5 h-3.5 mr-1" /> Training
            </Button>
            <Button size="sm" variant="outline" onClick={() => openCreateModal("MATCH", dateStr)}>
              <Trophy className="w-3.5 h-3.5 mr-1 text-amber-600" /> Match
            </Button>
          </div>
        </div>

        {dayEvents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
            <CalendarDays className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-brand-navy">No activities on this date</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Plan training drills or schedule competitive matches using the action buttons above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {dayEvents.map((act) => {
              const isMatch = act.type === "MATCH";
              const isCancelled = act.status === "CANCELLED";

              return (
                <Card
                  key={act.id}
                  className={`cursor-pointer hover:shadow-md transition-all ${
                    isCancelled ? "opacity-60 line-through" : ""
                  }`}
                  onClick={() => {
                    setSelectedActivity(act);
                    setIsDetailModalOpen(true);
                  }}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          isMatch ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {isMatch ? <Trophy className="w-3.5 h-3.5" /> : <ActivityIcon className="w-3.5 h-3.5" />}
                        {act.type} &bull; {act.sport.toUpperCase()}
                      </span>
                      <Badge
                        variant={
                          act.status === "COMPLETED"
                            ? "success"
                            : act.status === "CANCELLED"
                            ? "danger"
                            : "primary"
                        }
                      >
                        {act.status}
                      </Badge>
                    </div>
                    <CardTitle className="text-base mt-2">{act.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-xs">
                    <div className="flex items-center gap-2 text-slate-600">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {act.time} {act.endTime ? `– ${act.endTime}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-slate-600">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{act.venue}</span>
                    </div>
                    {isMatch && act.opponent && (
                      <div className="flex items-center gap-2 font-bold text-amber-900">
                        <Trophy className="w-4 h-4 text-amber-600" />
                        <span>Opponent: {act.opponent}</span>
                      </div>
                    )}
                    {act.notes && (
                      <p className="text-[11px] text-slate-500 bg-slate-50 p-2 rounded-lg mt-2">
                        {act.notes}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Render Upcoming List View
  const renderListView = () => {
    let filtered = activities;

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          (a.opponent && a.opponent.toLowerCase().includes(q)) ||
          a.venue.toLowerCase().includes(q)
      );
    }

    return (
      <div className="space-y-4">
        {/* Search bar inside list view */}
        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search activities by title, opponent, or venue..."
            className="w-full text-xs text-brand-navy outline-hidden placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="text-xs text-slate-400 hover:text-slate-600 px-2"
            >
              Clear
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="text-sm font-bold text-brand-navy">No upcoming activities found</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your filters or schedule a new training session or match.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((act) => {
              const isMatch = act.type === "MATCH";
              const isCancelled = act.status === "CANCELLED";

              return (
                <div
                  key={act.id}
                  onClick={() => {
                    setSelectedActivity(act);
                    setIsDetailModalOpen(true);
                  }}
                  className={`rounded-2xl bg-white border p-4 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                    isCancelled
                      ? "border-slate-200 opacity-60 line-through"
                      : isMatch
                      ? "border-amber-200/80 hover:border-amber-300"
                      : "border-blue-200/80 hover:border-blue-300"
                  }`}
                >
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                        isMatch ? "bg-amber-50 text-amber-600" : "bg-blue-50 text-brand-primary"
                      }`}
                    >
                      {isMatch ? <Trophy className="w-6 h-6" /> : <ActivityIcon className="w-6 h-6" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            isMatch ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {act.type} &bull; {act.sport}
                        </span>
                        <Badge
                          variant={
                            act.status === "COMPLETED"
                              ? "success"
                              : act.status === "CANCELLED"
                              ? "danger"
                              : "primary"
                          }
                        >
                          {act.status}
                        </Badge>
                      </div>
                      <h4 className="text-sm font-bold text-brand-navy mt-1">{act.title}</h4>
                      {isMatch && act.opponent && (
                        <p className="text-xs font-semibold text-amber-900 mt-0.5">
                          vs {act.opponent}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600 border-t sm:border-t-0 pt-2 sm:pt-0">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4 text-slate-400" />
                      <span>{act.date}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>
                        {act.time} {act.endTime ? `– ${act.endTime}` : ""}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span className="truncate max-w-[140px]">{act.venue}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <AppShell title="Training & Match Calendar" role="COACH">
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Top Control Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={handlePrev}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
                title="Previous period"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleToday}
                className="px-3 py-1 rounded-lg text-xs font-bold text-slate-700 hover:bg-white transition-colors"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors"
                title="Next period"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-black text-brand-navy">
              {viewMode === "day"
                ? currentDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                : currentDate.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </h2>
          </div>

          {/* View Mode Switcher & Quick Actions */}
          <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl text-xs font-bold shrink-0">
              <button
                type="button"
                onClick={() => setViewMode("month")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "month" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => setViewMode("week")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "week" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => setViewMode("day")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "day" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                Day
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-lg transition-all ${
                  viewMode === "list" ? "bg-white text-brand-navy shadow-xs" : "text-slate-600 hover:text-brand-navy"
                }`}
              >
                List
              </button>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2 shrink-0">
              <Button
                size="sm"
                onClick={() => openCreateModal("TRAINING")}
                className="bg-brand-primary text-white hover:bg-brand-primaryHover text-xs font-bold"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Training
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => openCreateModal("MATCH")}
                className="border-amber-300 text-amber-900 bg-amber-50 hover:bg-amber-100 text-xs font-bold"
              >
                <Trophy className="w-3.5 h-3.5 mr-1 text-amber-600" />
                Match
              </Button>
            </div>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white px-4 py-3 rounded-2xl border border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-bold text-slate-500 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters:
            </span>

            {/* Sport Selector */}
            <select
              value={selectedSport}
              onChange={(e) => setSelectedSport(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-brand-navy font-semibold focus:outline-hidden focus:ring-1 focus:ring-brand-primary"
            >
              {AVAILABLE_SPORTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.label}
                </option>
              ))}
            </select>

            {/* Activity Type Selector */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg">
              {["ALL", "TRAINING", "MATCH"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedType(t)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                    selectedType === t
                      ? "bg-white text-brand-navy shadow-2xs"
                      : "text-slate-500 hover:text-brand-navy"
                  }`}
                >
                  {t === "ALL" ? "All Types" : t === "TRAINING" ? "Training" : "Matches"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={fetchActivities} disabled={isLoading}>
              <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-xs font-semibold text-emerald-900 flex items-center gap-2.5 shadow-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs font-semibold text-rose-900 flex items-center gap-2.5 shadow-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Calendar Body according to active view mode */}
        {isLoading && activities.length === 0 ? (
          <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200">
            <div className="text-center">
              <RefreshCw className="w-8 h-8 text-brand-primary animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500 font-medium">Loading academy calendar...</p>
            </div>
          </div>
        ) : viewMode === "month" ? (
          renderMonthGrid()
        ) : viewMode === "week" ? (
          renderWeekView()
        ) : viewMode === "day" ? (
          renderDayView()
        ) : (
          renderListView()
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Activity Details Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        {selectedActivity && (
          <Modal
            isOpen={isDetailModalOpen}
            onClose={() => setIsDetailModalOpen(false)}
            title={
              selectedActivity.type === "MATCH"
                ? `Match Details: vs ${selectedActivity.opponent || "Opponent"}`
                : `Training Session: ${selectedActivity.title}`
            }
          >
            <div className="space-y-4 text-xs">
              {/* Status Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-bold text-xs ${
                      selectedActivity.type === "MATCH"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {selectedActivity.type === "MATCH" ? (
                      <Trophy className="w-3.5 h-3.5" />
                    ) : (
                      <ActivityIcon className="w-3.5 h-3.5" />
                    )}
                    {selectedActivity.type} &bull; {selectedActivity.sport.toUpperCase()}
                  </span>
                </div>
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

              {/* Core Specs */}
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
                    Venue / Ground
                  </span>
                  <p className="font-bold text-brand-navy">{selectedActivity.venue}</p>
                </div>
                {selectedActivity.type === "MATCH" && (
                  <div className="col-span-2">
                    <span className="text-[10px] font-bold uppercase text-slate-400 block mb-0.5">
                      Opponent Team
                    </span>
                    <p className="font-bold text-amber-900">{selectedActivity.opponent}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedActivity.notes && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">
                    Coach Instructions & Notes
                  </span>
                  <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 whitespace-pre-line leading-relaxed">
                    {selectedActivity.notes}
                  </p>
                </div>
              )}

              {/* Cancellation Reason if cancelled */}
              {selectedActivity.status === "CANCELLED" && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-rose-900">
                  <span className="font-bold flex items-center gap-1.5 mb-1">
                    <Ban className="w-3.5 h-3.5 text-rose-600" /> Cancelled Activity
                  </span>
                  <p className="text-[11px]">
                    Reason: {selectedActivity.cancelReason || "Cancelled by coach."}
                  </p>
                </div>
              )}

              {/* Workflow Links */}
              {selectedActivity.type === "TRAINING" && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-brand-navy">Attendance Integration</h5>
                      <p className="text-[11px] text-slate-500">
                        {selectedActivity.sessionInfo
                          ? `Linked Session: ${selectedActivity.sessionInfo.status} (${selectedActivity.sessionInfo.totalRoster} athletes snapshotted)`
                          : "No practice session directly linked to this activity yet."}
                      </p>
                    </div>
                    {selectedActivity.sessionId ? (
                      <Link
                        href={`/coach/sessions`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 shadow-2xs"
                      >
                        <span>Manage Session</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    ) : (
                      <Link
                        href={`/coach/sessions`}
                        className="inline-flex items-center gap-1 text-xs font-bold text-brand-primary bg-white px-3 py-1.5 rounded-lg border border-blue-200 hover:bg-blue-50 shadow-2xs"
                      >
                        <span>Create Practice Session</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {selectedActivity.type === "MATCH" && (
                <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-3.5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-amber-950">Match Management</h5>
                      <p className="text-[11px] text-slate-600">
                        {selectedActivity.matchInfo
                          ? `Finalized match sheet with ${selectedActivity.matchInfo.participantsCount} athletes recorded.`
                          : "Scheduled fixture awaiting completion and coach scorecard entry."}
                      </p>
                    </div>
                    <Link
                      href={`/coach/matches`}
                      className="inline-flex items-center gap-1 text-xs font-bold text-amber-900 bg-white px-3 py-1.5 rounded-lg border border-amber-300 hover:bg-amber-50 shadow-2xs"
                    >
                      <span>{selectedActivity.matchInfo ? "View Scorecard" : "Record Scorecard"}</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteActivity(selectedActivity.id)}
                  className="text-rose-600 border-rose-200 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete
                </Button>

                <div className="flex items-center gap-2">
                  {selectedActivity.status !== "CANCELLED" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setCancelReasonInput("");
                        setIsCancelModalOpen(true);
                      }}
                      className="text-amber-800 border-amber-200 hover:bg-amber-50"
                    >
                      <Ban className="w-3.5 h-3.5 mr-1 text-amber-600" /> Cancel
                    </Button>
                  )}

                  <Button
                    size="sm"
                    onClick={() => openEditModal(selectedActivity)}
                    className="bg-brand-primary text-white"
                  >
                    <Edit2 className="w-3.5 h-3.5 mr-1" /> Edit
                  </Button>
                </div>
              </div>
            </div>
          </Modal>
        )}

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Create Activity Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Modal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title={createType === "MATCH" ? "Schedule Competitive Match" : "Schedule Training Session"}
        >
          <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
            {/* Title */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Activity Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                placeholder={
                  createType === "MATCH"
                    ? "e.g. State League Qualifying Fixture"
                    : "e.g. Tactical Defense & Passing Drill"
                }
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
              />
            </div>

            {/* Sport & Date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Sport <span className="text-rose-500">*</span>
                </label>
                <select
                  value={formSport}
                  onChange={(e) => setFormSport(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium capitalize focus:border-brand-primary focus:outline-hidden"
                >
                  {AVAILABLE_SPORTS.filter((s) => s.id !== "all").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Time & End Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Start Time (24h) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time (Optional)</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
                />
              </div>
            </div>

            {/* Opponent (for Matches) */}
            {createType === "MATCH" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Opponent Team / Club <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formOpponent}
                  onChange={(e) => setFormOpponent(e.target.value)}
                  placeholder="e.g. Ranchi United FC / Bokaro XI"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
                />
              </div>
            )}

            {/* Venue */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue / Ground</label>
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                placeholder="e.g. Dumka Sports Complex Main Ground"
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
              />
            </div>

            {/* Optional Notes */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">Optional Notes</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Equipment needed, kit color, warm-up targets..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary focus:outline-hidden"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreateModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={formSubmitting}
                className="bg-brand-primary text-white"
              >
                {formSubmitting ? "Scheduling..." : "Confirm Schedule"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Edit Activity Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Scheduled Activity"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Activity Title</label>
              <input
                type="text"
                required
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sport</label>
                <select
                  value={formSport}
                  onChange={(e) => setFormSport(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium capitalize"
                >
                  {AVAILABLE_SPORTS.filter((s) => s.id !== "all").map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Start Time</label>
                <input
                  type="time"
                  required
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={formEndTime}
                  onChange={(e) => setFormEndTime(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                />
              </div>
            </div>

            {selectedActivity?.type === "MATCH" && (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Opponent</label>
                <input
                  type="text"
                  required
                  value={formOpponent}
                  onChange={(e) => setFormOpponent(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
                />
              </div>
            )}

            <div>
              <label className="block font-bold text-slate-700 mb-1">Venue</label>
              <input
                type="text"
                value={formVenue}
                onChange={(e) => setFormVenue(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Notes</label>
              <textarea
                rows={2}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={formSubmitting} className="bg-brand-primary text-white">
                {formSubmitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </Modal>

        {/* ───────────────────────────────────────────────────────────── */}
        {/* Cancel Confirmation Modal */}
        {/* ───────────────────────────────────────────────────────────── */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Cancel Scheduled Activity"
        >
          <form onSubmit={handleCancelSubmit} className="space-y-4 text-xs">
            <p className="text-slate-600">
              Are you sure you want to cancel{" "}
              <strong className="text-brand-navy">{selectedActivity?.title}</strong>? Cancelled
              activities will remain visible on the calendar with a cancelled badge.
            </p>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Cancellation Reason (Optional)</label>
              <textarea
                rows={2}
                value={cancelReasonInput}
                onChange={(e) => setCancelReasonInput(e.target.value)}
                placeholder="e.g. Inclement weather / pitch maintenance / opponent reschedule..."
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-brand-primary"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCancelModalOpen(false)}>
                Go Back
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={formSubmitting}
                className="bg-rose-600 hover:bg-rose-700 text-white"
              >
                {formSubmitting ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
