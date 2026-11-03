import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function GET() {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const pendingPlayers = await Player.find({ registrationStatus: "PENDING" })
      .sort({ createdAt: -1 })
      .lean();

    const playerIds = pendingPlayers.map((p) => p._id);
    const users = await User.find({ playerId: { $in: playerIds } }).lean();
    const userMap = new Map(users.map((u) => [u.playerId?.toString(), u]));

    const registrations = pendingPlayers.map((p) => {
      const u = userMap.get(p._id.toString());
      return {
        id: p._id.toString(),
        name: p.name,
        age: p.age,
        sport: p.sport,
        email: u?.email || "N/A",
        registrationStatus: p.registrationStatus,
        createdAt: p.createdAt,
      };
    });

    return NextResponse.json({
      data: {
        registrations,
        count: registrations.length,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return ApiErrors.forbidden(error.message);
    }
    console.error("Fetch pending registrations error:", error);
    return ApiErrors.internal("Failed to fetch pending registrations.");
  }
}
