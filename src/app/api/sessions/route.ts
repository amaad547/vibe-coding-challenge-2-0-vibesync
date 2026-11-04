import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Session } from "@/models/Session";
import { Player } from "@/models/Player";
import { createSessionSchema } from "@/lib/validation/session";
import { normalizeCalendarDate } from "@/lib/utils/date";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.trim().toLowerCase();
    const status = searchParams.get("status")?.trim().toUpperCase();

    const filter: Record<string, unknown> = {};
    if (sport) filter.sport = sport;
    if (status && (status === "OPEN" || status === "CLOSED")) filter.status = status;

    const sessions = await Session.find(filter).sort({ date: -1, createdAt: -1 }).lean();

    const formattedSessions = sessions.map((s) => {
      let presentCount = 0;
      let absentCount = 0;
      let unmarkedCount = 0;

      for (const entry of s.roster) {
        if (entry.status === "PRESENT") presentCount++;
        else if (entry.status === "ABSENT") absentCount++;
        else unmarkedCount++;
      }

      return {
        id: s._id.toString(),
        date: s.date,
        sport: s.sport,
        status: s.status,
        totalRoster: s.roster.length,
        presentCount,
        absentCount,
        unmarkedCount,
        createdBy: s.createdBy.toString(),
        closedBy: s.closedBy?.toString() || null,
        closedAt: s.closedAt || null,
        createdAt: s.createdAt,
      };
    });

    return NextResponse.json({
      data: {
        sessions: formattedSessions,
        count: formattedSessions.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("Fetch sessions error:", error);
    return ApiErrors.internal("Failed to retrieve practice sessions.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const coach = await requireRole("COACH");
    await connectToDatabase();

    const body = await request.json();
    const parsed = createSessionSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid session date or sport.", parsed.error.format());
    }

    const { date: dateStr, sport } = parsed.data;
    const normalizedDate = normalizeCalendarDate(dateStr);

    // Invariant: One session per sport/date in MVP
    const existing = await Session.findOne({
      date: normalizedDate,
      sport,
    });

    if (existing) {
      return ApiErrors.conflict(
        "SESSION_ALREADY_EXISTS",
        `A practice session for ${sport.toUpperCase()} on ${dateStr} already exists.`
      );
    }

    // Invariant: Snapshot active players registered for that sport when opened
    const activeSportPlayers = await Player.find({
      sport,
      isActive: true,
      registrationStatus: "VERIFIED",
    })
      .sort({ name: 1 })
      .lean();

    if (activeSportPlayers.length === 0) {
      return ApiErrors.conflict(
        "NO_ELIGIBLE_PLAYERS",
        `Cannot open session: No active verified players are currently registered for ${sport.toUpperCase()}.`
      );
    }

    const roster = activeSportPlayers.map((player) => ({
      playerId: player._id,
      playerNameSnapshot: player.name,
      playerSkillSnapshot: player.skill || "All-Rounder",
      status: null,
    }));

    const session = await Session.create({
      date: normalizedDate,
      sport,
      status: "OPEN",
      roster,
      createdBy: coach.id,
    });

    return NextResponse.json(
      {
        data: {
          message: "Practice session opened successfully with roster snapshot.",
          session: {
            id: session._id.toString(),
            date: session.date,
            sport: session.sport,
            status: session.status,
            totalRoster: session.roster.length,
            roster: session.roster.map((r) => ({
              playerId: r.playerId.toString(),
              playerNameSnapshot: r.playerNameSnapshot,
              status: r.status,
            })),
          },
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
    console.error("Open session error:", error);
    return ApiErrors.internal("Failed to open practice session.");
  }
}
