import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireUser, requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { updatePlayerSchema } from "@/lib/validation/player";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await requireUser();
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid player ID format.");
    }

    // Role-based visibility scoping
    if (session.role === "PLAYER") {
      // Player can ONLY access their own player record
      if (!session.playerId || session.playerId !== id) {
        return ApiErrors.notFound("Player record not found.");
      }
    } else if (session.role === "SCOUT") {
      // Scout endpoint is /api/scout/ready-players, not general directory
      return ApiErrors.forbidden("Scouts cannot access the general player directory.");
    }

    await connectToDatabase();

    const player = await Player.findById(id).lean();
    if (!player) {
      return ApiErrors.notFound("Player record not found.");
    }

    const linkedUser = await User.findOne({ playerId: player._id }).select("-passwordHash").lean();

    return NextResponse.json({
      data: {
        player: {
          id: player._id.toString(),
          name: player.name,
          age: player.age,
          sport: player.sport,
          isActive: player.isActive,
          registrationStatus: player.registrationStatus,
          rejectionReason: player.rejectionReason,
          createdAt: player.createdAt,
          updatedAt: player.updatedAt,
        },
        user: linkedUser
          ? {
              id: linkedUser._id.toString(),
              email: linkedUser.email,
              role: linkedUser.role,
              accountStatus: linkedUser.accountStatus,
            }
          : null,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("Get player error:", error);
    return ApiErrors.internal("Failed to retrieve player profile.");
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // COACH-ONLY: Players can NEVER modify profiles or verification status
    await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid player ID format.");
    }

    const body = await request.json();
    const parsed = updatePlayerSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid profile update data.", parsed.error.format());
    }

    await connectToDatabase();

    const player = await Player.findById(id);
    if (!player) {
      return ApiErrors.notFound("Player not found.");
    }

    const updates = parsed.data;
    if (updates.name !== undefined) player.name = updates.name;
    if (updates.age !== undefined) player.age = updates.age;
    if (updates.sport !== undefined) player.sport = updates.sport;
    if (updates.isActive !== undefined) player.isActive = updates.isActive;

    await player.save();

    return NextResponse.json({
      data: {
        message: "Player profile updated successfully.",
        player: {
          id: player._id.toString(),
          name: player.name,
          age: player.age,
          sport: player.sport,
          isActive: player.isActive,
          registrationStatus: player.registrationStatus,
          updatedAt: player.updatedAt,
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
    console.error("Update player error:", error);
    return ApiErrors.internal("Failed to update player profile.");
  }
}
