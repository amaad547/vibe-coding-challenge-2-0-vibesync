import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid player ID format.");
    }

    await connectToDatabase();

    const player = await Player.findById(id);
    if (!player) {
      return ApiErrors.notFound("Player not found.");
    }

    // Soft-archive: Historical attendance and matches remain intact
    player.isActive = false;
    await player.save();

    await User.findOneAndUpdate({ playerId: player._id }, { isActive: false });

    return NextResponse.json({
      data: {
        message: "Player archived successfully. Historical records preserved.",
        player: {
          id: player._id.toString(),
          name: player.name,
          isActive: player.isActive,
          registrationStatus: player.registrationStatus,
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
    console.error("Archive player error:", error);
    return ApiErrors.internal("Failed to archive player.");
  }
}
