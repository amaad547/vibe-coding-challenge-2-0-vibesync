import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireUser, requireRole } from "@/lib/auth/session";
import { Activity, IActivity } from "@/models/Activity";
import { Session } from "@/models/Session";
import { Match } from "@/models/Match";
import { updateActivitySchema } from "@/lib/validation/activity";
import { normalizeCalendarDate, formatCalendarDate } from "@/lib/utils/date";
import { ApiErrors, AppError } from "@/lib/errors/api-error";
import mongoose from "mongoose";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireUser();
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid activity ID format.");
    }

    const activity = await Activity.findById(id).lean<IActivity | null>();
    if (!activity) {
      return ApiErrors.notFound("Activity not found.");
    }

    let sessionInfo = null;
    let matchInfo = null;
    let resolvedStatus = activity.status;

    if (activity.sessionId) {
      const session = await Session.findById(activity.sessionId).lean();
      if (session) {
        sessionInfo = {
          id: session._id.toString(),
          status: session.status,
          sport: session.sport,
          date: formatCalendarDate(session.date),
          totalRoster: session.roster?.length || 0,
          closedAt: session.closedAt || null,
        };
        if (session.status === "CLOSED" && activity.status !== "CANCELLED") {
          resolvedStatus = "COMPLETED";
        }
      }
    }

    if (activity.matchId) {
      const match = await Match.findById(activity.matchId).lean();
      if (match) {
        matchInfo = {
          id: match._id.toString(),
          status: match.status,
          sport: match.sport,
          opponent: match.opponent,
          date: formatCalendarDate(match.date),
          participantsCount: match.participants?.length || 0,
        };
        if (match.status === "FINALIZED" && activity.status !== "CANCELLED") {
          resolvedStatus = "COMPLETED";
        }
      }
    }

    return NextResponse.json({
      data: {
        id: activity._id.toString(),
        type: activity.type,
        title: activity.title,
        sport: activity.sport,
        date: formatCalendarDate(activity.date),
        rawDate: activity.date,
        time: activity.time,
        endTime: activity.endTime || null,
        venue: activity.venue || (activity.type === "MATCH" ? "Dumka Sports Stadium" : "Dumka Academy Ground"),
        opponent: activity.opponent || null,
        notes: activity.notes || null,
        status: resolvedStatus,
        sessionId: activity.sessionId ? activity.sessionId.toString() : null,
        sessionInfo,
        matchId: activity.matchId ? activity.matchId.toString() : null,
        matchInfo,
        cancelReason: activity.cancelReason || null,
        cancelledAt: activity.cancelledAt || null,
        createdAt: activity.createdAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/activities/[id] error:", error);
    return ApiErrors.internal("Failed to retrieve activity details.");
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid activity ID format.");
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return ApiErrors.notFound("Activity not found.");
    }

    const body = await request.json();
    const parsed = updateActivitySchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid activity update data.", parsed.error.format());
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
    if (parsed.data.sport !== undefined) updateData.sport = parsed.data.sport;
    if (parsed.data.date !== undefined) updateData.date = normalizeCalendarDate(parsed.data.date);
    if (parsed.data.time !== undefined) updateData.time = parsed.data.time;
    if (parsed.data.endTime !== undefined) updateData.endTime = parsed.data.endTime || undefined;
    if (parsed.data.venue !== undefined) updateData.venue = parsed.data.venue;
    if (parsed.data.opponent !== undefined) updateData.opponent = parsed.data.opponent;
    if (parsed.data.notes !== undefined) updateData.notes = parsed.data.notes;
    if (parsed.data.status !== undefined) updateData.status = parsed.data.status;

    if (parsed.data.sessionId !== undefined) {
      if (parsed.data.sessionId === "") {
        updateData.sessionId = undefined;
      } else if (mongoose.Types.ObjectId.isValid(parsed.data.sessionId)) {
        const session = await Session.findById(parsed.data.sessionId).lean();
        if (!session) {
          return ApiErrors.notFound("Referenced practice session does not exist.");
        }
        updateData.sessionId = session._id;
      } else {
        return ApiErrors.badRequest("Invalid sessionId format.");
      }
    }

    if (parsed.data.matchId !== undefined) {
      if (parsed.data.matchId === "") {
        updateData.matchId = undefined;
      } else if (mongoose.Types.ObjectId.isValid(parsed.data.matchId)) {
        const match = await Match.findById(parsed.data.matchId).lean();
        if (!match) {
          return ApiErrors.notFound("Referenced match does not exist.");
        }
        updateData.matchId = match._id;
      } else {
        return ApiErrors.badRequest("Invalid matchId format.");
      }
    }

    const updated = await Activity.findByIdAndUpdate(id, { $set: updateData }, { new: true });

    return NextResponse.json({
      success: true,
      message: "Activity updated successfully.",
      data: {
        id: updated!._id.toString(),
        type: updated!.type,
        title: updated!.title,
        sport: updated!.sport,
        date: formatCalendarDate(updated!.date),
        time: updated!.time,
        endTime: updated!.endTime || null,
        venue: updated!.venue,
        opponent: updated!.opponent || null,
        notes: updated!.notes || null,
        status: updated!.status,
        sessionId: updated!.sessionId?.toString() || null,
        matchId: updated!.matchId?.toString() || null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/activities/[id] error:", error);
    return ApiErrors.internal("Failed to update activity.");
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid activity ID format.");
    }

    const deleted = await Activity.findByIdAndDelete(id);
    if (!deleted) {
      return ApiErrors.notFound("Activity not found.");
    }

    return NextResponse.json({
      success: true,
      message: "Activity deleted successfully.",
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("DELETE /api/activities/[id] error:", error);
    return ApiErrors.internal("Failed to delete activity.");
  }
}

