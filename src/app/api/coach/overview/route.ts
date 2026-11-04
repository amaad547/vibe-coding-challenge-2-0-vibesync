import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { Session } from "@/models/Session";
import { Match } from "@/models/Match";
import { getAcademyReadiness } from "@/lib/services/readiness";
import { AppError } from "@/lib/errors/api-error";

export async function GET() {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    // 1. Player counts
    const [totalActive, totalPending, totalArchived, totalVerified] = await Promise.all([
      Player.countDocuments({ isActive: true }),
      Player.countDocuments({ registrationStatus: "PENDING" }),
      Player.countDocuments({ isActive: false }),
      Player.countDocuments({ registrationStatus: "VERIFIED", isActive: true }),
    ]);

    // 2. Pending registrations (recent 5)
    const pendingList = await Player.find({ registrationStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 3. Sessions counts & recent sessions
    const [totalSessions, closedSessionsCount, openSessionsCount, recentSessions] =
      await Promise.all([
        Session.countDocuments(),
        Session.countDocuments({ status: "CLOSED" }),
        Session.countDocuments({ status: "OPEN" }),
        Session.find().sort({ date: -1, createdAt: -1 }).limit(5).lean(),
      ]);

    // 4. Matches counts & recent matches
    const [totalMatches, recentMatches] = await Promise.all([
      Match.countDocuments({ status: "FINALIZED" }),
      Match.find({ status: "FINALIZED" }).sort({ date: -1, createdAt: -1 }).limit(5).lean(),
    ]);

    // 5. Readiness Summary
    const readiness = await getAcademyReadiness({ onlyActive: true, onlyVerified: true });
    const readyCount = readiness.filter((p) => p.isReady).length;

    return NextResponse.json({
      data: {
        playerStats: {
          totalActive,
          totalPending,
          totalArchived,
          totalVerified,
          readyForScouts: readyCount,
        },
        pendingRegistrations: pendingList.map((p) => ({
          id: p._id.toString(),
          name: p.name,
          age: p.age,
          sport: p.sport,
          createdAt: p.createdAt,
        })),
        sessionStats: {
          totalSessions,
          closedSessions: closedSessionsCount,
          openSessions: openSessionsCount,
        },
        recentSessions: recentSessions.map((s) => ({
          id: s._id.toString(),
          date: s.date,
          sport: s.sport,
          status: s.status,
          totalRoster: s.roster.length,
          presentCount: s.roster.filter((r) => r.status === "PRESENT").length,
        })),
        matchStats: {
          totalMatches,
        },
        recentMatches: recentMatches.map((m) => ({
          id: m._id.toString(),
          date: m.date,
          sport: m.sport,
          opponent: m.opponent,
          totalParticipants: m.participants.length,
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
    console.error("GET /api/coach/overview error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch coach overview" } },
      { status: 500 }
    );
  }
}

