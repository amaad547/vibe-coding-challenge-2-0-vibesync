import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Session } from "@/models/Session";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid session ID format.");
    }

    await connectToDatabase();

    const session = await Session.findById(id).lean();
    if (!session) {
      return ApiErrors.notFound("Practice session not found.");
    }

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
        session: {
          id: session._id.toString(),
          date: session.date,
          sport: session.sport,
          status: session.status,
          totalRoster: session.roster.length,
          presentCount,
          absentCount,
          unmarkedCount,
          createdBy: session.createdBy.toString(),
          closedBy: session.closedBy?.toString() || null,
          closedAt: session.closedAt || null,
          createdAt: session.createdAt,
          roster: session.roster.map((r) => ({
            playerId: r.playerId.toString(),
            playerNameSnapshot: r.playerNameSnapshot,
            playerSkillSnapshot: r.playerSkillSnapshot || "All-Rounder",
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
    console.error("Get session error:", error);
    return ApiErrors.internal("Failed to retrieve practice session.");
  }
}
