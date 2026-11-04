import { connectToDatabase } from "@/lib/db/mongodb";
import { Player } from "@/models/Player";
import { Session } from "@/models/Session";
import { normalizeCalendarDate } from "@/lib/utils/date";

export interface PlayerAttendanceSummary {
  playerId: string;
  sport: string;
  held: number;
  present: number;
  absent: number;
  rate: number; // unrounded ratio e.g. 0.75
  percentage: number; // formatted to 1 decimal place e.g. 75.0
}

export async function calculatePlayerAttendance(
  playerId: string
): Promise<PlayerAttendanceSummary> {
  await connectToDatabase();

  const player = await Player.findById(playerId).lean();
  if (!player) {
    throw new Error("Player not found.");
  }

  const playerCreationDateNormalized = normalizeCalendarDate(player.createdAt);

  // Invariant: Denominator includes only CLOSED sessions for player's sport from player's creation date forward
  const closedSessions = await Session.find({
    sport: player.sport.toLowerCase(),
    status: "CLOSED",
    date: { $gte: playerCreationDateNormalized },
  }).lean();

  const held = closedSessions.length;
  let present = 0;
  let absent = 0;

  for (const session of closedSessions) {
    const rosterEntry = session.roster.find((r) => r.playerId.toString() === playerId);
    if (rosterEntry?.status === "PRESENT") {
      present++;
    } else if (rosterEntry?.status === "ABSENT") {
      absent++;
    }
  }

  const rate = held === 0 ? 0 : present / held;
  const percentage = Math.round(rate * 1000) / 10;

  return {
    playerId: player._id.toString(),
    sport: player.sport,
    held,
    present,
    absent,
    rate,
    percentage,
  };
}
