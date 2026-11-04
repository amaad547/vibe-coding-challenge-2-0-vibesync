import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { getAcademyReadiness } from "@/lib/services/readiness";
import { AppError } from "@/lib/errors/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireRole("SCOUT");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.trim().toLowerCase();
    const search = searchParams.get("search")?.trim().toLowerCase();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10", 10)));

    // 1. Invariant: Only verified active athletes can be considered
    const allEvaluated = await getAcademyReadiness({
      sport,
      onlyActive: true,
      onlyVerified: true,
    });

    // 2. Invariant: Scout list contains READY players ONLY
    let readyPlayers = allEvaluated.filter((p) => p.isReady);

    // 3. Search filter operates strictly within the Ready set
    if (search) {
      readyPlayers = readyPlayers.filter(
        (p) => p.playerName.toLowerCase().includes(search) || p.sport.toLowerCase().includes(search)
      );
    }

    const total = readyPlayers.length;
    const startIndex = (page - 1) * limit;
    const paginated = readyPlayers.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      data: {
        players: paginated.map((p) => ({
          id: p.playerId,
          name: p.playerName,
          age: p.age,
          sport: p.sport,
          skill: p.skill || "All-Rounder",
          attendancePercentage: p.attendancePercentage,
          heldSessions: p.heldSessions,
          presentSessions: p.presentSessions,
          matchesPlayed: p.matchesPlayed,
          isReady: true,
        })),
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
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
    console.error("GET /api/scout/ready-players error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch ready talent" } },
      { status: 500 }
    );
  }
}
