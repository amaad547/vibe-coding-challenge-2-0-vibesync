import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Session } from "@/models/Session";
import { updateAttendanceSchema } from "@/lib/validation/session";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid session ID format.");
    }

    const body = await request.json();
    const parsed = updateAttendanceSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid attendance marks payload.", parsed.error.format());
    }

    const { marks } = parsed.data;

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return ApiErrors.notFound("Practice session not found.");
    }

    // Invariant: Closed sessions are immutable and locked
    if (session.status === "CLOSED") {
      return ApiErrors.conflict(
        "SESSION_LOCKED",
        "This session is CLOSED and immutable. Attendance entries cannot be modified."
      );
    }

    // Build map of current roster entries by playerId
    const rosterMap = new Map<string, (typeof session.roster)[0]>();
    for (const entry of session.roster) {
      rosterMap.set(entry.playerId.toString(), entry);
    }

    // Validate and apply marks
    for (const mark of marks) {
      const entry = rosterMap.get(mark.playerId);
      if (!entry) {
        return ApiErrors.badRequest(
          `Player ID ${mark.playerId} is not part of this session's snapshotted roster.`
        );
      }
      entry.status = mark.status;
    }

    await session.save();

    let presentCount = 0;
    let absentCount = 0;
    let unmarkedCount = 0;

    for (const entry of session.roster) {
      if (entry.status === "PRESENT") presentCount++;
      else if (entry.status === "ABSENT") absentCount++;
      else unmarkedCount++;
    }

    return NextResponse.json({
      data: {
        message: "Attendance marks saved successfully.",
        sessionId: session._id.toString(),
        totalRoster: session.roster.length,
        presentCount,
        absentCount,
        unmarkedCount,
        roster: session.roster.map((r) => ({
          playerId: r.playerId.toString(),
          playerNameSnapshot: r.playerNameSnapshot,
          status: r.status,
        })),
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("Mark attendance error:", error);
    return ApiErrors.internal("Failed to update attendance marks.");
  }
}
