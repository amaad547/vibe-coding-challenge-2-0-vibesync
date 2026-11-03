import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Player } from "@/models/Player";
import { ApiErrors } from "@/lib/errors/api-error";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return ApiErrors.unauthorized("No active session.");
    }

    let playerProfile = null;
    if (session.role === "PLAYER" && session.playerId) {
      await connectToDatabase();
      playerProfile = await Player.findById(session.playerId).lean();
    }

    return NextResponse.json({
      data: {
        user: {
          id: session.userId,
          email: session.email,
          role: session.role,
          playerId: session.playerId,
          accountStatus: session.accountStatus,
        },
        player: playerProfile
          ? {
              id: playerProfile._id.toString(),
              name: playerProfile.name,
              age: playerProfile.age,
              sport: playerProfile.sport,
              isActive: playerProfile.isActive,
              registrationStatus: playerProfile.registrationStatus,
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Auth me error:", error);
    return ApiErrors.internal("Failed to retrieve profile.");
  }
}

