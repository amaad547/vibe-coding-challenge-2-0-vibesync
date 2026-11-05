import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { User, IUser } from "@/models/User";
import { updateCoachProfileSchema } from "@/lib/validation/coach-profile";
import { AppError } from "@/lib/errors/api-error";
import { DEFAULT_CONTACT_DETAILS } from "@/lib/services/contact";

export async function GET() {
  try {
    const session = await requireRole("COACH");
    await connectToDatabase();

    const coach = await User.findById(session.userId).lean<IUser | null>();
    if (!coach) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Coach account could not be found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      data: {
        id: coach._id.toString(),
        email: coach.email,
        role: coach.role,
        name: coach.name || DEFAULT_CONTACT_DETAILS.coachName,
        phone: coach.phone || DEFAULT_CONTACT_DETAILS.phone,
        officePhone: coach.officePhone || DEFAULT_CONTACT_DETAILS.officePhone,
        academyAddress: coach.academyAddress || DEFAULT_CONTACT_DETAILS.academyAddress,
        morningHours: coach.morningHours || DEFAULT_CONTACT_DETAILS.morningHours,
        eveningHours: coach.eveningHours || DEFAULT_CONTACT_DETAILS.eveningHours,
        emergencyContact: coach.emergencyContact || DEFAULT_CONTACT_DETAILS.emergencyContact,
        bio: coach.bio || DEFAULT_CONTACT_DETAILS.bio,
        updatedAt: coach.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/coach/profile error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch coach profile." } },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await requireRole("COACH");
    await connectToDatabase();

    const body = await request.json();
    const parsed = updateCoachProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid profile data provided.",
            details: parsed.error.format(),
          },
        },
        { status: 400 }
      );
    }

    const {
      name,
      phone,
      officePhone,
      academyAddress,
      morningHours,
      eveningHours,
      emergencyContact,
      bio,
    } = parsed.data;

    const updatedCoach = await User.findByIdAndUpdate(
      session.userId,
      {
        $set: {
          name,
          phone,
          officePhone,
          academyAddress,
          morningHours,
          eveningHours,
          emergencyContact,
          bio,
        },
      },
      { new: true }
    ).lean<IUser | null>();

    if (!updatedCoach) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Coach account not found." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Coach profile and landing page contact details updated successfully.",
      data: {
        id: updatedCoach._id.toString(),
        email: updatedCoach.email,
        name: updatedCoach.name,
        phone: updatedCoach.phone,
        officePhone: updatedCoach.officePhone,
        academyAddress: updatedCoach.academyAddress,
        morningHours: updatedCoach.morningHours,
        eveningHours: updatedCoach.eveningHours,
        emergencyContact: updatedCoach.emergencyContact,
        bio: updatedCoach.bio,
        updatedAt: updatedCoach.updatedAt,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("PATCH /api/coach/profile error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to update coach profile." } },
      { status: 500 }
    );
  }
}
