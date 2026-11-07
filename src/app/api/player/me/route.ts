import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { Match } from "@/models/Match";
import { Session } from "@/models/Session";
import { calculatePlayerReadiness } from "@/lib/services/readiness";
import { normalizeCalendarDate } from "@/lib/utils/date";
import { AppError } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const session = await requireRole("PLAYER");
    await connectToDatabase();

    if (!session.playerId) {
      return NextResponse.json(
        {
          error: {
            code: "PROFILE_NOT_LINKED",
            message: "No athlete profile is associated with this player account.",
          },
        },
        { status: 404 }
      );
    }

    const player = await Player.findById(session.playerId).lean();
    if (!player) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Player record could not be found." } },
        { status: 404 }
      );
    }

    // Dynamic readiness evaluation (also computes attendance)
    const readiness = await calculatePlayerReadiness(session.playerId);

    // Fetch practice session track record
    const playerObjectId = new mongoose.Types.ObjectId(session.playerId);
    const practiceSessions = await Session.find({
      sport: player.sport.toLowerCase(),
      status: "CLOSED",
      $or: [
        { "roster.playerId": playerObjectId },
        { date: { $gte: normalizeCalendarDate(player.createdAt) } },
      ],
    })
      .sort({ date: -1 })
      .lean();

    const sessionHistory = practiceSessions.map((s) => {
      const entry = s.roster.find((r) => r.playerId.toString() === session.playerId);
      return {
        id: s._id.toString(),
        date: s.date,
        sport: s.sport,
        status: entry ? entry.status : "UNMARKED",
      };
    });

    // Player match history
    const matches = await Match.find({
      status: "FINALIZED",
      "participants.playerId": player._id,
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const formattedMatches = matches.map((m) => {
      const myPerformance = m.participants.find((p) => p.playerId.toString() === session.playerId);

      return {
        id: m._id.toString(),
        date: m.date,
        sport: m.sport,
        opponent: m.opponent,
        myScore: myPerformance ? myPerformance.score : 0,
        scoreMetric: myPerformance ? myPerformance.scoreMetric : "Points",
        scoreUnit: myPerformance ? myPerformance.scoreUnit : "Points",
        playerRoleSnapshot: myPerformance?.playerRoleSnapshot || player.skill || "Athlete",
        stats: myPerformance?.stats || {},
        formattedSummary: myPerformance?.formattedSummary || "",
        totalAthletes: m.participants.length,
      };
    });

    return NextResponse.json({
      data: {
        player: {
          id: player._id.toString(),
          name: player.name,
          age: player.age,
          sport: player.sport,
          skill: player.skill || "All-Rounder",
          isActive: player.isActive,
          registrationStatus: player.registrationStatus,
          createdAt: player.createdAt,
        },
        attendance: {
          heldSessions: readiness.heldSessions,
          presentSessions: readiness.presentSessions,
          absentSessions: readiness.absentSessions,
          rawRatio: readiness.rawAttendanceRatio,
          percentage: readiness.attendancePercentage,
          isEligible: readiness.isAttendanceEligible,
        },
        readiness: {
          isReady: readiness.isReady,
          isAttendanceEligible: readiness.isAttendanceEligible,
          isMatchesEligible: readiness.isMatchesEligible,
          matchesPlayed: readiness.matchesPlayed,
          reason: readiness.readinessReason,
        },
        sessions: sessionHistory,
        matches: formattedMatches,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/player/me error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch player portal data" } },
      { status: 500 }
    );
  }
}
