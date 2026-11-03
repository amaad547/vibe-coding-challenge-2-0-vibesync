import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { reviewRegistrationSchema } from "@/lib/validation/auth";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const coach = await requireRole("COACH");
    const { id } = await params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid player ID format.");
    }

    const body = await request.json();
    const parsed = reviewRegistrationSchema.safeParse(body);
    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid review decision payload.", parsed.error.format());
    }

    const { decision, rejectionReason } = parsed.data;

    await connectToDatabase();

    const player = await Player.findById(id);
    if (!player) {
      return ApiErrors.notFound("Player registration not found.");
    }

    if (player.registrationStatus !== "PENDING") {
      return ApiErrors.conflict(
        "ALREADY_REVIEWED",
        `This registration has already been reviewed (${player.registrationStatus}).`
      );
    }

    const now = new Date();
    const coachObjectId = new mongoose.Types.ObjectId(coach.id);

    if (decision === "APPROVE") {
      player.registrationStatus = "VERIFIED";
      player.isActive = true;
      player.reviewedBy = coachObjectId;
      player.reviewedAt = now;
      player.rejectionReason = undefined;
      await player.save();

      await User.findOneAndUpdate(
        { playerId: player._id },
        {
          accountStatus: "ACTIVE",
          registrationStatus: "VERIFIED",
          isActive: true,
          reviewedBy: coachObjectId,
          reviewedAt: now,
          rejectionReason: undefined,
        }
      );
    } else {
      player.registrationStatus = "REJECTED";
      player.isActive = false;
      player.reviewedBy = coachObjectId;
      player.reviewedAt = now;
      player.rejectionReason = rejectionReason || "Application did not meet academy criteria.";
      await player.save();

      await User.findOneAndUpdate(
        { playerId: player._id },
        {
          accountStatus: "REJECTED",
          registrationStatus: "REJECTED",
          isActive: false,
          reviewedBy: coachObjectId,
          reviewedAt: now,
          rejectionReason: player.rejectionReason,
        }
      );
    }

    return NextResponse.json({
      data: {
        message: `Registration ${decision === "APPROVE" ? "approved and activated" : "rejected"}.`,
        playerId: player._id.toString(),
        registrationStatus: player.registrationStatus,
        isActive: player.isActive,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return ApiErrors.forbidden(error.message);
    }
    console.error("Review registration error:", error);
    return ApiErrors.internal("Failed to process registration review.");
  }
}
