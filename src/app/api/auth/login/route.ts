import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { User } from "@/models/User";
import { loginSchema } from "@/lib/validation/auth";
import { verifyPassword } from "@/lib/auth/password";
import { signSessionToken } from "@/lib/auth/token";
import { setSessionCookie } from "@/lib/auth/session";
import { ApiErrors, createErrorResponse } from "@/lib/errors/api-error";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid login credentials format.", parsed.error.format());
    }

    const { email, password } = parsed.data;

    await connectToDatabase();

    const user = await User.findOne({ email });
    if (!user) {
      return createErrorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    const isMatch = await verifyPassword(password, user.passwordHash);
    if (!isMatch) {
      return createErrorResponse("INVALID_CREDENTIALS", "Invalid email or password.", 401);
    }

    // Role-specific verification & account status validation
    if (user.role === "PLAYER") {
      if (user.accountStatus === "PENDING" || user.registrationStatus === "PENDING") {
        return createErrorResponse(
          "ACCOUNT_PENDING",
          "Your registration is awaiting coach verification.",
          403
        );
      }

      if (user.accountStatus === "REJECTED" || user.registrationStatus === "REJECTED") {
        return createErrorResponse(
          "ACCOUNT_REJECTED",
          "Your registration was not approved by the academy.",
          403
        );
      }

      if (!user.isActive) {
        return createErrorResponse("ACCOUNT_INACTIVE", "Your account is deactivated.", 403);
      }
    } else {
      // COACH or SCOUT
      if (!user.isActive || user.accountStatus !== "ACTIVE") {
        return createErrorResponse("ACCOUNT_INACTIVE", "Your account is deactivated.", 403);
      }
    }

    // Generate JWT token & set HTTP-only cookie
    const token = await signSessionToken({
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      playerId: user.playerId?.toString(),
      accountStatus: user.accountStatus,
    });

    await setSessionCookie(token);

    return NextResponse.json({
      data: {
        user: {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          playerId: user.playerId?.toString(),
          accountStatus: user.accountStatus,
        },
      },
    });
  } catch (error) {
    console.error("Login route error:", error);
    return ApiErrors.internal("An unexpected error occurred during login.");
  }
}
