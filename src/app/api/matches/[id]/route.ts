import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Match } from "@/models/Match";
import { AppError } from "@/lib/errors/api-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { id } = await params;
    const match = await Match.findById(id).lean();

    if (!match) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Match not found" } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        match: {
          id: match._id.toString(),
          date: match.date,
          sport: match.sport,
          opponent: match.opponent,
          sessionId: match.sessionId.toString(),
          totalParticipants: match.participants.length,
          participants: match.participants.map((p) => ({
            playerId: p.playerId.toString(),
            playerNameSnapshot: p.playerNameSnapshot,
            score: p.score,
            scoreMetric: p.scoreMetric,
            scoreUnit: p.scoreUnit,
          })),
          status: match.status,
          createdBy: match.createdBy.toString(),
          createdAt: match.createdAt,
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
    console.error("GET /api/matches/[id] error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch match details" } },
      { status: 500 }
    );
  }
}
