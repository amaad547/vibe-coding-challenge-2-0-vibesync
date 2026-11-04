import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";
import { Player, IPlayer } from "@/models/Player";
import { Session } from "@/models/Session";
import { Match } from "@/models/Match";
import { normalizeCalendarDate } from "@/lib/utils/date";

export interface PlayerReadinessResult {
  playerId: string;
  playerName: string;
  age: number;
  sport: string;
  skill?: string;
  registrationStatus: "PENDING" | "VERIFIED" | "REJECTED";
  isActive: boolean;
  heldSessions: number;
  presentSessions: number;
  absentSessions: number;
  rawAttendanceRatio: number; // Exact unrounded ratio
  attendancePercentage: number; // Display formatted to 1 decimal place e.g. 75.0
  matchesPlayed: number;
  isAttendanceEligible: boolean; // exact ratio >= 0.75
  isMatchesEligible: boolean; // matchesPlayed >= 2
  isReady: boolean; // isAttendanceEligible && isMatchesEligible
  readinessReason: string;
}

/**
 * Pure evaluation function for calculating readiness from raw inputs.
 * Uses exact unrounded ratio for >= 0.75 comparison.
 */
export function evaluateReadiness(
  heldSessions: number,
  presentSessions: number,
  matchesPlayed: number
): {
  matchesPlayed: number;
  rawAttendanceRatio: number;
  attendancePercentage: number;
  isAttendanceEligible: boolean;
  isMatchesEligible: boolean;
  isReady: boolean;
  readinessReason: string;
} {
  // If no eligible sessions exist, attendance is 0%
  const rawAttendanceRatio = heldSessions === 0 ? 0 : presentSessions / heldSessions;
  const attendancePercentage = Math.round(rawAttendanceRatio * 1000) / 10;

  // Strict unrounded comparison: >= 0.75
  const isAttendanceEligible = rawAttendanceRatio >= 0.75;
  const isMatchesEligible = matchesPlayed >= 2;
  const isReady = isAttendanceEligible && isMatchesEligible;

  let readinessReason = "Ready for trial evaluation";
  if (!isAttendanceEligible && !isMatchesEligible) {
    readinessReason = `Needs at least 75% attendance (current: ${attendancePercentage}%) and ${
      2 - matchesPlayed
    } more match(es)`;
  } else if (!isAttendanceEligible) {
    readinessReason = `Attendance (${attendancePercentage}%) is below the required 75.0% threshold`;
  } else if (!isMatchesEligible) {
    const remaining = 2 - matchesPlayed;
    readinessReason = `Requires ${remaining} more finalized match participation${
      remaining === 1 ? "" : "s"
    }`;
  }

  return {
    matchesPlayed,
    rawAttendanceRatio,
    attendancePercentage,
    isAttendanceEligible,
    isMatchesEligible,
    isReady,
    readinessReason,
  };
}

/**
 * Calculates real-time readiness for a single player by ID.
 * Recalculates dynamically from verified MongoDB records.
 */
export async function calculatePlayerReadiness(playerId: string): Promise<PlayerReadinessResult> {
  await connectToDatabase();

  const player = await Player.findById(playerId).lean<IPlayer | null>();
  if (!player) {
    throw new Error(`Player with ID ${playerId} not found.`);
  }

  return calculateSinglePlayerReadiness(player);
}

/**
 * Internal helper to compute readiness for an already loaded Player document.
 */
async function calculateSinglePlayerReadiness(player: IPlayer): Promise<PlayerReadinessResult> {
  const playerId = player._id.toString();
  const playerCreationDateNormalized = normalizeCalendarDate(player.createdAt);

  // 1. Invariant: Closed practice sessions for player's sport since player creation
  const closedSessions = await Session.find({
    sport: player.sport.toLowerCase(),
    status: "CLOSED",
    date: { $gte: playerCreationDateNormalized },
  }).lean();

  const heldSessions = closedSessions.length;
  let presentSessions = 0;
  let absentSessions = 0;

  for (const session of closedSessions) {
    const entry = session.roster.find((r) => r.playerId.toString() === playerId);
    if (entry?.status === "PRESENT") {
      presentSessions++;
    } else if (entry?.status === "ABSENT") {
      absentSessions++;
    }
  }

  // 2. Invariant: Count of finalized matches in which the player participated
  const playerObjectId = new mongoose.Types.ObjectId(playerId);
  const matchesPlayed = await Match.countDocuments({
    status: "FINALIZED",
    "participants.playerId": playerObjectId,
  });

  // 3. Evaluate criteria using pure evaluator
  const evalResult = evaluateReadiness(heldSessions, presentSessions, matchesPlayed);

  return {
    playerId,
    playerName: player.name,
    age: player.age,
    sport: player.sport,
    skill: player.skill || "All-Rounder",
    registrationStatus: player.registrationStatus,
    isActive: player.isActive,
    heldSessions,
    presentSessions,
    absentSessions,
    ...evalResult,
  };
}

/**
 * Batch calculation of readiness for academy players.
 * Supports filtering by sport and active/verified status.
 */
export async function getAcademyReadiness(options?: {
  sport?: string;
  onlyActive?: boolean;
  onlyVerified?: boolean;
}): Promise<PlayerReadinessResult[]> {
  await connectToDatabase();

  const filter: Record<string, unknown> = {};
  if (options?.sport) {
    filter.sport = options.sport.toLowerCase();
  }
  if (options?.onlyActive !== false) {
    filter.isActive = true;
  }
  if (options?.onlyVerified !== false) {
    filter.registrationStatus = "VERIFIED";
  }

  const players = await Player.find(filter).sort({ name: 1 }).lean<IPlayer[]>();

  // Process players in parallel
  const results = await Promise.all(
    players.map((player) => calculateSinglePlayerReadiness(player))
  );

  return results;
}
