import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Player } from "@/models/Player";
import { User } from "@/models/User";
import { createPlayerSchema, queryPlayersSchema } from "@/lib/validation/player";
import { hashPassword } from "@/lib/auth/password";
import { ApiErrors, AppError } from "@/lib/errors/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const parsedQuery = queryPlayersSchema.safeParse({
      status: searchParams.get("status") || "all",
      sport: searchParams.get("sport") || undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") || 1,
      limit: searchParams.get("limit") || 10,
    });

    if (!parsedQuery.success) {
      return ApiErrors.badRequest("Invalid query parameters.", parsedQuery.error.format());
    }

    const { status, sport, search, page, limit } = parsedQuery.data;

    // Build Mongoose filter
    const filter: Record<string, unknown> = {};

    if (status === "active") {
      filter.isActive = true;
      filter.registrationStatus = "VERIFIED";
    } else if (status === "archived") {
      filter.isActive = false;
      filter.registrationStatus = "VERIFIED";
    } else if (status === "pending") {
      filter.registrationStatus = "PENDING";
    }
    // "all" covers all registration statuses unless further specified

    if (sport) {
      filter.sport = sport.toLowerCase();
    }

    if (search) {
      filter.name = { $regex: search, $options: "i" };
    }

    const total = await Player.countDocuments(filter);
    const totalPages = Math.ceil(total / limit) || 1;
    const skip = (page - 1) * limit;

    const players = await Player.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Attach linked user emails
    const playerIds = players.map((p) => p._id);
    const users = await User.find({ playerId: { $in: playerIds } }).lean();
    const userMap = new Map(users.map((u) => [u.playerId?.toString(), u]));

    const enrichedPlayers = players.map((p) => {
      const u = userMap.get(p._id.toString());
      return {
        id: p._id.toString(),
        name: p.name,
        age: p.age,
        sport: p.sport,
        isActive: p.isActive,
        registrationStatus: p.registrationStatus,
        email: u?.email || null,
        userAccountStatus: u?.accountStatus || null,
        rejectionReason: p.rejectionReason || null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    return NextResponse.json({
      data: {
        players: enrichedPlayers,
        pagination: {
          total,
          page,
          limit,
          totalPages,
          hasNextPage: page < totalPages,
          hasPrevPage: page > 1,
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
    console.error("List players error:", error);
    return ApiErrors.internal("Failed to retrieve players.");
  }
}

export async function POST(request: NextRequest) {
  try {
    const coach = await requireRole("COACH");
    await connectToDatabase();

    const body = await request.json();
    const parsed = createPlayerSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest("Invalid player input data.", parsed.error.format());
    }

    const { name, age, sport, email, temporaryPassword } = parsed.data;

    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return ApiErrors.conflict(
          "EMAIL_ALREADY_EXISTS",
          "An account with this email address already exists."
        );
      }
    }

    // Coach-created player is verified and active immediately
    const player = await Player.create({
      name,
      age,
      sport,
      isActive: true,
      registrationStatus: "VERIFIED",
      reviewedBy: coach.id,
      reviewedAt: new Date(),
    });

    let linkedUser = null;
    if (email) {
      const passwordToHash = temporaryPassword || "SportSync123!";
      const passwordHash = await hashPassword(passwordToHash);

      linkedUser = await User.create({
        email,
        passwordHash,
        role: "PLAYER",
        accountStatus: "ACTIVE",
        registrationStatus: "VERIFIED",
        playerId: player._id,
        isActive: true,
        reviewedBy: coach.id,
        reviewedAt: new Date(),
      });
    }

    return NextResponse.json(
      {
        data: {
          message: "Player created successfully.",
          player: {
            id: player._id.toString(),
            name: player.name,
            age: player.age,
            sport: player.sport,
            isActive: player.isActive,
            registrationStatus: player.registrationStatus,
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
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("Create player error:", error);
    return ApiErrors.internal("Failed to create player.");
  }
}

