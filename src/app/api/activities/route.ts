import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireUser, requireRole } from "@/lib/auth/session";
import { Activity, IActivity } from "@/models/Activity";
import { Session } from "@/models/Session";
import { Match } from "@/models/Match";
import { createActivitySchema } from "@/lib/validation/activity";
import { normalizeCalendarDate, formatCalendarDate } from "@/lib/utils/date";
import { ApiErrors, AppError } from "@/lib/errors/api-error";
import mongoose from "mongoose";

export async function GET(request: NextRequest) {
  try {
    // Both coaches and players are authorized to view academy schedule
    await requireUser();
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const startStr = searchParams.get("start")?.trim();
    const endStr = searchParams.get("end")?.trim();
    const type = searchParams.get("type")?.trim().toUpperCase();
    const sport = searchParams.get("sport")?.trim().toLowerCase();
    const status = searchParams.get("status")?.trim().toUpperCase();
    const upcoming = searchParams.get("upcoming") === "true";

    const filter: Record<string, unknown> = {};

    if (type && (type === "TRAINING" || type === "MATCH")) {
      filter.type = type;
    }

    if (sport && sport !== "all") {
      filter.sport = sport;
    }

    if (status && (status === "SCHEDULED" || status === "COMPLETED" || status === "CANCELLED")) {
      filter.status = status;
    }

    if (upcoming) {
      const today = normalizeCalendarDate(new Date());
      filter.date = { $gte: today };
      if (!status) {
        // Exclude cancelled activities for default upcoming view
        filter.status = { $ne: "CANCELLED" };
      }
    } else if (startStr || endStr) {
      const dateFilter: Record<string, Date> = {};
      if (startStr) {
        dateFilter.$gte = normalizeCalendarDate(startStr);
      }
      if (endStr) {
        dateFilter.$lte = normalizeCalendarDate(endStr);
      }
      filter.date = dateFilter;
    }

    const activities = await Activity.find(filter)
      .sort({ date: 1, time: 1, createdAt: 1 })
      .lean<IActivity[]>();

    // Fetch linked session statuses & match summaries to reflect real-time operational state
    const sessionIds = activities
      .map((a) => a.sessionId)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    const matchIds = activities
      .map((a) => a.matchId)
      .filter((id): id is mongoose.Types.ObjectId => Boolean(id));

    const [linkedSessions, linkedMatches] = await Promise.all([
      sessionIds.length > 0
        ? Session.find({ _id: { $in: sessionIds } }, "status roster closedAt").lean()
        : [],
      matchIds.length > 0
        ? Match.find({ _id: { $in: matchIds } }, "status opponent participants").lean()
        : [],
    ]);

    const sessionMap = new Map(linkedSessions.map((s) => [s._id.toString(), s]));
    const matchMap = new Map(linkedMatches.map((m) => [m._id.toString(), m]));

    const formattedActivities = activities.map((act) => {
      let resolvedStatus = act.status;
      let sessionInfo = null;
      let matchInfo = null;

      if (act.sessionId) {
        const linked = sessionMap.get(act.sessionId.toString());
        if (linked) {
          sessionInfo = {
            id: linked._id.toString(),
            status: linked.status,
            totalRoster: linked.roster?.length || 0,
            closedAt: linked.closedAt || null,
          };
          if (linked.status === "CLOSED" && act.status !== "CANCELLED") {
            resolvedStatus = "COMPLETED";
          }
        }
      }

      if (act.matchId) {
        const linked = matchMap.get(act.matchId.toString());
        if (linked) {
          matchInfo = {
            id: linked._id.toString(),
            status: linked.status,
            opponent: linked.opponent,
            participantsCount: linked.participants?.length || 0,
          };
          if (linked.status === "FINALIZED" && act.status !== "CANCELLED") {
            resolvedStatus = "COMPLETED";
          }
        }
      }

      return {
        id: act._id.toString(),
        type: act.type,
        title: act.title,
        sport: act.sport,
        date: formatCalendarDate(act.date),
        rawDate: act.date,
        time: act.time,
        endTime: act.endTime || null,
        venue: act.venue || (act.type === "MATCH" ? "Dumka Sports Stadium" : "Dumka Academy Ground"),
        opponent: act.opponent || null,
        notes: act.notes || null,
        status: resolvedStatus,
        sessionId: act.sessionId ? act.sessionId.toString() : null,
        sessionInfo,
        matchId: act.matchId ? act.matchId.toString() : null,
        matchInfo,
        cancelReason: act.cancelReason || null,
        cancelledAt: act.cancelledAt || null,
        createdAt: act.createdAt,
      };
    });

    return NextResponse.json({
      data: {
        activities: formattedActivities,
        count: formattedActivities.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/activities error:", error);
    return ApiErrors.internal("Failed to retrieve calendar activities.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const coach = await requireRole("COACH");
    await connectToDatabase();

    const body = await request.json();
    const parsed = createActivitySchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid activity details.", parsed.error.format());
    }

    const { type, title, sport, date: dateStr, time, endTime, venue, opponent, notes, sessionId } =
      parsed.data;
    const normalizedDate = normalizeCalendarDate(dateStr);

    // Invariant: Prevent accidental duplicate activities on the same date, sport, time & type
    const duplicateQuery: Record<string, unknown> = {
      type,
      sport,
      date: normalizedDate,
      time,
      status: { $ne: "CANCELLED" },
    };
    if (type === "MATCH" && opponent) {
      duplicateQuery.opponent = new RegExp(`^${opponent.trim()}$`, "i");
    }

    const existingDuplicate = await Activity.findOne(duplicateQuery).lean();
    if (existingDuplicate) {
      return ApiErrors.conflict(
        "DUPLICATE_ACTIVITY",
        `A ${type.toLowerCase()} activity for ${sport.toUpperCase()} is already scheduled on ${dateStr} at ${time}.`
      );
    }

    let linkedSessionId: mongoose.Types.ObjectId | undefined = undefined;

    if (sessionId) {
      if (!mongoose.Types.ObjectId.isValid(sessionId)) {
        return ApiErrors.badRequest("Invalid session ID format.");
      }
      const existingSession = await Session.findById(sessionId).lean();
      if (!existingSession) {
        return ApiErrors.notFound("Referenced practice session does not exist.");
      }
      linkedSessionId = new mongoose.Types.ObjectId(sessionId);
    } else if (type === "TRAINING") {
      // Auto-link to existing session on that date and sport if one exists
      const existingSession = await Session.findOne({
        sport,
        date: normalizedDate,
      }).lean();
      if (existingSession) {
        linkedSessionId = existingSession._id;
      }
    }

    const newActivity = await Activity.create({
      type,
      title,
      sport,
      date: normalizedDate,
      time,
      endTime: endTime || undefined,
      venue: venue || (type === "MATCH" ? "Dumka Sports Stadium" : "Dumka Academy Ground"),
      opponent: type === "MATCH" ? opponent : undefined,
      notes: notes || undefined,
      status: "SCHEDULED",
      sessionId: linkedSessionId,
      createdBy: new mongoose.Types.ObjectId(coach.id),
    });

    return NextResponse.json(
      {
        success: true,
        message: `${type === "MATCH" ? "Match" : "Training session"} scheduled successfully.`,
        data: {
          id: newActivity._id.toString(),
          type: newActivity.type,
          title: newActivity.title,
          sport: newActivity.sport,
          date: formatCalendarDate(newActivity.date),
          time: newActivity.time,
          endTime: newActivity.endTime || null,
          venue: newActivity.venue,
          opponent: newActivity.opponent || null,
          notes: newActivity.notes || null,
          status: newActivity.status,
          sessionId: newActivity.sessionId?.toString() || null,
          createdAt: newActivity.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/activities error:", error);
    return ApiErrors.internal("Failed to schedule activity.");
  }
}

