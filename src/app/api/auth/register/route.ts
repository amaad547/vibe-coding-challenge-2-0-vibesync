import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { Player } from "@/models/Player";
import { registerPlayerSchema } from "@/lib/validation/auth";
import { hashPassword } from "@/lib/auth/password";
import { ApiErrors } from "@/lib/errors/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = registerPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid registration input.", parsed.error.format());
    }

    const { name, email, password, age, sport } = parsed.data;

    await connectToDatabase();

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return ApiErrors.conflict(
        "EMAIL_ALREADY_EXISTS",
        "An account with this email address already exists."
      );
    }

    const hashedPassword = await hashPassword(password);

    // 1. Create Player record in PENDING status
    const player = await Player.create({
      name,
      age,
      sport,
      isActive: false,
      registrationStatus: "PENDING",
    });

    // 2. Create User record in PENDING status linked to player
    const user = await User.create({
      email,
      passwordHash: hashedPassword,
      role: "PLAYER",
      accountStatus: "PENDING",
      registrationStatus: "PENDING",
      playerId: player._id,
      isActive: false,
    });

    return NextResponse.json(
      {
        data: {
          message:
            "Registration submitted. Your account will be available after coach verification.",
          player: {
            id: player._id.toString(),
            name: player.name,
            sport: player.sport,
            age: player.age,
          },
          user: {
            id: user._id.toString(),
            email: user.email,
            role: user.role,
            accountStatus: user.accountStatus,
          },
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Player registration error:", error);
    return ApiErrors.internal("Failed to register player.");
  }
}
