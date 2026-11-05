import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Activity } from "@/models/Activity";
import { cancelActivitySchema } from "@/lib/validation/activity";
import { ApiErrors, AppError } from "@/lib/errors/api-error";
import mongoose from "mongoose";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const coach = await requireRole("COACH");
    await connectToDatabase();

    const { id } = await params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return ApiErrors.badRequest("Invalid activity ID format.");
    }

    const activity = await Activity.findById(id);
    if (!activity) {
      return ApiErrors.notFound("Activity not found.");
    }

    if (activity.status === "CANCELLED") {
      return ApiErrors.badRequest("Activity is already cancelled.");
    }

    let cancelReason = "Cancelled by Coach";
    try {
      const body = await request.json();
      const parsed = cancelActivitySchema.safeParse(body);
      if (parsed.success && parsed.data.reason) {
        cancelReason = parsed.data.reason;
      }
    } catch {
      // Empty or non-JSON body allowed, defaults to standard message
    }

    activity.status = "CANCELLED";
    activity.cancelledAt = new Date();
    activity.cancelledBy = new mongoose.Types.ObjectId(coach.id);
    activity.cancelReason = cancelReason;
    await activity.save();

    return NextResponse.json({
      success: true,
      message: "Activity marked as cancelled.",
      data: {
        id: activity._id.toString(),
        status: activity.status,
        cancelledAt: activity.cancelledAt,
        cancelReason: activity.cancelReason,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("POST /api/activities/[id]/cancel error:", error);
    return ApiErrors.internal("Failed to cancel activity.");
  }
}

