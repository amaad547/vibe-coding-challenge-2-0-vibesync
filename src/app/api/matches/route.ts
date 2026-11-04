import { NextRequest, NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireRole } from "@/lib/auth/session";
import { Match } from "@/models/Match";
import { Session } from "@/models/Session";
import { createMatchSchema } from "@/lib/validation/match";
import { getSportScoreConfig } from "@/lib/services/sport-config";
import { normalizeCalendarDate, formatCalendarDate } from "@/lib/utils/date";
import { AppError } from "@/lib/errors/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireRole("COACH");
    await connectToDatabase();

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.trim().toLowerCase();
    const date = searchParams.get("date")?.trim();
    const playerId = searchParams.get("playerId")?.trim();
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (sport) {
      filter.sport = sport;
    }
    if (date) {
      filter.date = normalizeCalendarDate(date);
    }
    if (playerId) {
      filter["participants.playerId"] = playerId;
    }

    const [total, matches] = await Promise.all([
      Match.countDocuments(filter),
      Match.find(filter).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
    ]);

    const formattedMatches = matches.map((m) => {
      const topScore = m.participants.reduce((max, p) => (p.score > max ? p.score : max), 0);

      return {
        id: m._id.toString(),
        date: m.date,
        sport: m.sport,
        opponent: m.opponent,
        sessionId: m.sessionId.toString(),
        totalParticipants: m.participants.length,
        topScore,
        participants: m.participants.map((p) => ({
          playerId: p.playerId.toString(),
          playerNameSnapshot: p.playerNameSnapshot,
          score: p.score,
          scoreMetric: p.scoreMetric,
          scoreUnit: p.scoreUnit,
        })),
        status: m.status,
        createdBy: m.createdBy.toString(),
        createdAt: m.createdAt,
      };
    });

    return NextResponse.json({
      data: {
        matches: formattedMatches,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
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
    console.error("GET /api/matches error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch matches" } },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await requireRole("COACH");
    await connectToDatabase();

    const body = await request.json();
    const result = createMatchSchema.safeParse(body);

    if (!result.success) {
      const firstIssue = result.error.issues[0];
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: firstIssue?.message || "Invalid match data",
            details: result.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { sessionId, date, sport, opponent, participants } = result.data;

    // 1. Fetch linked Session
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_NOT_FOUND",
            message: "The linked practice session could not be found",
          },
        },
        { status: 404 }
      );
    }

    // 2. Invariant: Session must be CLOSED
    if (session.status !== "CLOSED") {
      return NextResponse.json(
        {
          error: {
            code: "SESSION_NOT_CLOSED",
            message:
              "Matches can only be linked to a CLOSED practice session. Please close and finalize the session first.",
          },
        },
        { status: 409 }
      );
    }

    // 3. Invariant: Match date must match Session date
    const sessionDateStr = formatCalendarDate(session.date);
    if (sessionDateStr !== date) {
      return NextResponse.json(
        {
          error: {
            code: "DATE_MISMATCH",
            message: `Match date (${date}) does not match linked session date (${sessionDateStr})`,
          },
        },
        { status: 400 }
      );
    }

    // 4. Invariant: Match sport must match Session sport
    if (session.sport.toLowerCase() !== sport.toLowerCase()) {
      return NextResponse.json(
        {
          error: {
            code: "SPORT_MISMATCH",
            message: `Match sport (${sport}) does not match linked session sport (${session.sport})`,
          },
        },
        { status: 400 }
      );
    }

    // 5. Invariant: Athletes must be in session roster AND marked PRESENT
    // Client-submitted athlete eligibility is strictly verified against server session roster
    const rosterMap = new Map<
      string,
      { playerNameSnapshot: string; status: "PRESENT" | "ABSENT" | null }
    >();
    for (const entry of session.roster) {
      rosterMap.set(entry.playerId.toString(), {
        playerNameSnapshot: entry.playerNameSnapshot,
        status: entry.status,
      });
    }

    // 6. Server-derived sport score metric and unit (never trust client)
    const { scoreMetric, scoreUnit } = await getSportScoreConfig(sport);

    const verifiedParticipants = [];
    for (const participant of participants) {
      const rosterEntry = rosterMap.get(participant.playerId);

      if (!rosterEntry) {
        return NextResponse.json(
          {
            error: {
              code: "PLAYER_NOT_ELIGIBLE",
              message: `Athlete with ID ${participant.playerId} is not in the linked session roster`,
            },
          },
          { status: 409 }
        );
      }

      if (rosterEntry.status !== "PRESENT") {
        return NextResponse.json(
          {
            error: {
              code: "PLAYER_NOT_ELIGIBLE",
              message: `Athlete "${rosterEntry.playerNameSnapshot}" is not eligible for this match because they were marked ${rosterEntry.status || "UNMARKED"} in the linked practice session`,
            },
          },
          { status: 409 }
        );
      }

      verifiedParticipants.push({
        playerId: participant.playerId,
        playerNameSnapshot: rosterEntry.playerNameSnapshot,
        score: participant.score,
        scoreMetric,
        scoreUnit,
      });
    }

    // 7. Create finalized Match record
    const match = await Match.create({
      date: normalizeCalendarDate(date),
      sport,
      opponent,
      sessionId: session._id,
      participants: verifiedParticipants,
      status: "FINALIZED",
      createdBy: user.id,
    });

    return NextResponse.json(
      {
        data: {
          match: {
            id: match._id.toString(),
            date: match.date,
            sport: match.sport,
            opponent: match.opponent,
            sessionId: match.sessionId.toString(),
            totalParticipants: match.participants.length,
            participants: match.participants.map((p) => ({
              playerId: p.playerId.toString(),
              playerNameSnapshot: p.playerNameSnapshot,
              score: p.score,
              scoreMetric: p.scoreMetric,
              scoreUnit: p.scoreUnit,
            })),
            status: match.status,
            createdBy: match.createdBy.toString(),
            createdAt: match.createdAt,
          },
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
    console.error("POST /api/matches error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to record match" } },
      { status: 500 }
    );
  }
}
