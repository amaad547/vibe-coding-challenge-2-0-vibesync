import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Session } from "@/models/Session";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coach = await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid session ID format.");
    }

    await connectToDatabase();

    const session = await Session.findById(id);
    if (!session) {
      return ApiErrors.notFound("Practice session not found.");
    }

    // Invariant: Cannot close an already closed session
    if (session.status === "CLOSED") {
      return ApiErrors.conflict(
        "SESSION_LOCKED",
        "This practice session is already CLOSED and locked."
      );
    }

    // Invariant: Verify every roster entry is marked PRESENT or ABSENT
    const unmarkedPlayers: Array<{ playerId: string; name: string }> = [];
    let presentCount = 0;
    let absentCount = 0;

    for (const entry of session.roster) {
      if (entry.status === "PRESENT") {
        presentCount++;
      } else if (entry.status === "ABSENT") {
        absentCount++;
      } else {
        unmarkedPlayers.push({
          playerId: entry.playerId.toString(),
          name: entry.playerNameSnapshot,
        });
      }
    }

    if (unmarkedPlayers.length > 0) {
      return ApiErrors.badRequest(
        `Cannot close session: ${unmarkedPlayers.length} player(s) are not marked. Every roster player must be marked Present or Absent before session closure.`,
        { unmarkedPlayers }
      );
    }

    // Atomically close and lock session
    session.status = "CLOSED";
    session.closedBy = new mongoose.Types.ObjectId(coach.id);
    session.closedAt = new Date();
    await session.save();

    return NextResponse.json({
      data: {
        message:
          "Practice session closed and permanently locked. Attendance now counts towards player readiness.",
        session: {
          id: session._id.toString(),
          date: session.date,
          sport: session.sport,
          status: session.status,
          totalRoster: session.roster.length,
          presentCount,
          absentCount,
          closedAt: session.closedAt,
          closedBy: session.closedBy.toString(),
          roster: session.roster.map((r) => ({
            playerId: r.playerId.toString(),
            playerNameSnapshot: r.playerNameSnapshot,
            status: r.status,
          })),
        },
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("Close session error:", error);
    return ApiErrors.internal("Failed to close practice session.");
  }
}
