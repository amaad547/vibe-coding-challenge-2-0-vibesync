import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { Match } from "@/models/Match";
import { calculatePlayerReadiness } from "@/lib/services/readiness";
import { AppError } from "@/lib/errors/api-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("SCOUT");
    await connectToDatabase();

    const { id } = await params;

    const player = await Player.findById(id).lean();
    if (!player || !player.isActive || player.registrationStatus !== "VERIFIED") {
      return NextResponse.json(
        {
          error: {
            code: "PLAYER_NOT_READY",
            message: "Athlete is not ready or not found in the scouting registry",
          },
        },
        { status: 404 }
      );
    }

    // 1. Invariant: Scout detail route MUST re-check Ready status server-side
    const readiness = await calculatePlayerReadiness(id);
    if (!readiness.isReady) {
      return NextResponse.json(
        {
          error: {
            code: "PLAYER_NOT_READY",
            message: "Athlete is not ready or not found in the scouting registry",
          },
        },
        { status: 404 }
      );
    }

    // 2. Fetch match history with scores for this ready athlete
    const matches = await Match.find({
      status: "FINALIZED",
      "participants.playerId": player._id,
    })
      .sort({ date: -1, createdAt: -1 })
      .lean();

    const matchPerformances = matches.map((m) => {
      const p = m.participants.find((entry) => entry.playerId.toString() === id);
      return {
        id: m._id.toString(),
        date: m.date,
        sport: m.sport,
        opponent: m.opponent,
        score: p ? p.score : 0,
        scoreMetric: p ? p.scoreMetric : "Points",
        scoreUnit: p ? p.scoreUnit : "Points",
        playerRoleSnapshot: p?.playerRoleSnapshot || player.skill || "Athlete",
        stats: p?.stats || {},
        formattedSummary: p?.formattedSummary || "",
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
          enrolledAt: player.createdAt,
        },
        readinessEvidence: {
          attendancePercentage: readiness.attendancePercentage,
          heldSessions: readiness.heldSessions,
          presentSessions: readiness.presentSessions,
          absentSessions: readiness.absentSessions,
          matchesPlayed: readiness.matchesPlayed,
          isReady: true,
        },
        matchHistory: matchPerformances,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/scout/ready-players/:id error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch scouting dossier" } },
      { status: 500 }
    );
  }
}
