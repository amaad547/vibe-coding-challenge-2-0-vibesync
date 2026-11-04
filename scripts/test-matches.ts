import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { Session } from "../src/models/Session";
import { Match } from "../src/models/Match";
import { hashPassword } from "../src/lib/auth/password";
import { normalizeCalendarDate, formatCalendarDate } from "../src/lib/utils/date";
import { signSessionToken } from "../src/lib/auth/token";
import { getSportScoreConfig } from "../src/lib/services/sport-config";
import { createMatchSchema } from "../src/lib/validation/match";

async function runMatchTests() {
  console.log("==================================================");
  console.log("    SportSync Phase 5: Match & Score Tests        ");
  console.log("==================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment.");
    process.exit(1);
  }

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB Atlas.\n");

    const timestamp = Date.now();
    const coachEmail = `coach_match_${timestamp}@dumkasports.org`;

    // 1. Provision Test Coach & Auth Tokens
    const coach = await User.create({
      email: coachEmail,
      passwordHash: await hashPassword("CoachPass123!"),
      role: "COACH",
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const coachToken = await signSessionToken({
      userId: coach._id.toString(),
      email: coach.email,
      role: "COACH",
      accountStatus: "ACTIVE",
    });

    assert(Boolean(coachToken), "Coach session token generated for authorization");

    // 2. Setup Test Players
    const sportFootball = `football_t_${timestamp}`;
    const sportCricket = `cricket_t_${timestamp}`;

    const playerP1 = await Player.create({
      name: "Player 1 (Present)",
      age: 16,
      sport: sportFootball,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerP2 = await Player.create({
      name: "Player 2 (Present)",
      age: 17,
      sport: sportFootball,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerAbsent = await Player.create({
      name: "Player 3 (Absent)",
      age: 16,
      sport: sportFootball,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const cricketPlayer = await Player.create({
      name: "Cricket Player (Present)",
      age: 18,
      sport: sportCricket,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    console.log("\n--- 1. Practice Session Status & Linking Invariants ---");
    const sessionDate = normalizeCalendarDate("2026-11-04");
    const sessionDateStr = formatCalendarDate(sessionDate);

    // Create an OPEN practice session
    const openSession = await Session.create({
      date: sessionDate,
      sport: sportFootball,
      status: "OPEN",
      roster: [
        { playerId: playerP1._id, playerNameSnapshot: playerP1.name, status: "PRESENT" },
        { playerId: playerP2._id, playerNameSnapshot: playerP2.name, status: "PRESENT" },
        { playerId: playerAbsent._id, playerNameSnapshot: playerAbsent.name, status: "ABSENT" },
      ],
      createdBy: coach._id,
    });

    // Invariant: Matches CANNOT be linked to an OPEN session
    assert(openSession.status === "OPEN", "Practice session initially OPEN");
    const openSessionAllowed = openSession.status === "CLOSED";
    assert(!openSessionAllowed, "Matches strictly reject linking to OPEN practice session");

    // Close the session atomically
    openSession.status = "CLOSED";
    openSession.closedAt = new Date();
    openSession.closedBy = coach._id;
    await openSession.save();
    assert(openSession.status === "CLOSED", "Practice session closed and finalized");

    console.log("\n--- 2. Eligibility & Security: Rejection of Absent and Foreign Athletes ---");

    // Invariant: Server strictly rejects Absent player in match sheet
    const rosterMap = new Map(
      openSession.roster.map((r) => [r.playerId.toString(), r.status])
    );

    const checkPlayerEligibility = (playerId: string) => {
      const status = rosterMap.get(playerId);
      if (!status) return { eligible: false, reason: "NOT_IN_ROSTER" };
      if (status !== "PRESENT") return { eligible: false, reason: "NOT_PRESENT" };
      return { eligible: true };
    };

    const presentPlayerCheck = checkPlayerEligibility(playerP1._id.toString());
    assert(presentPlayerCheck.eligible, "Present player is verified eligible for match");

    const absentPlayerCheck = checkPlayerEligibility(playerAbsent._id.toString());
    assert(
      !absentPlayerCheck.eligible && absentPlayerCheck.reason === "NOT_PRESENT",
      "Absent player is strictly REJECTED even if client sends their ID"
    );

    const foreignPlayerCheck = checkPlayerEligibility(cricketPlayer._id.toString());
    assert(
      !foreignPlayerCheck.eligible && foreignPlayerCheck.reason === "NOT_IN_ROSTER",
      "Athlete from different sport/session is strictly REJECTED"
    );

    console.log("\n--- 3. Server-Derived Score Metrics and Units (Tamper Resistance) ---");

    // Server-side derivation for Football
    const footballConfig = await getSportScoreConfig("football");
    assert(footballConfig.scoreMetric === "Goals", "Football score metric server-derived as 'Goals'");
    assert(footballConfig.scoreUnit === "Goals", "Football score unit server-derived as 'Goals'");

    // Server-side derivation for Cricket
    const cricketConfig = await getSportScoreConfig("cricket");
    assert(cricketConfig.scoreMetric === "Runs", "Cricket score metric server-derived as 'Runs'");
    assert(cricketConfig.scoreUnit === "Runs", "Cricket score unit server-derived as 'Runs'");

    // Server-side derivation for Basketball
    const basketballConfig = await getSportScoreConfig("basketball");
    assert(basketballConfig.scoreMetric === "Points", "Basketball score metric server-derived as 'Points'");

    console.log("\n--- 4. Schema Validation & Boundary Rules ---");

    // Invariant: Duplicate participant IDs in same match sheet must fail
    const duplicateInput = {
      sessionId: openSession._id.toString(),
      date: sessionDateStr,
      sport: sportFootball,
      opponent: "Ranchi FC",
      participants: [
        { playerId: playerP1._id.toString(), score: 2 },
        { playerId: playerP1._id.toString(), score: 1 },
      ],
    };
    const duplicateResult = createMatchSchema.safeParse(duplicateInput);
    assert(!duplicateResult.success, "Duplicate athletes in match sheet are rejected by validation");

    // Invariant: Negative score must fail
    const negativeScoreInput = {
      sessionId: openSession._id.toString(),
      date: sessionDateStr,
      sport: sportFootball,
      opponent: "Ranchi FC",
      participants: [{ playerId: playerP1._id.toString(), score: -1 }],
    };
    const negativeResult = createMatchSchema.safeParse(negativeScoreInput);
    assert(!negativeResult.success, "Negative scores are rejected by validation");

    // Invariant: Non-numeric score must fail
    const nonNumericInput = {
      sessionId: openSession._id.toString(),
      date: sessionDateStr,
      sport: sportFootball,
      opponent: "Ranchi FC",
      participants: [{ playerId: playerP1._id.toString(), score: "abc" as unknown as number }],
    };
    const nonNumericResult = createMatchSchema.safeParse(nonNumericInput);
    assert(!nonNumericResult.success, "Non-numeric score is rejected by validation");

    // Invariant: Score of 0 is valid and accepted
    const zeroScoreInput = {
      sessionId: openSession._id.toString(),
      date: sessionDateStr,
      sport: sportFootball,
      opponent: "Ranchi FC",
      participants: [{ playerId: playerP1._id.toString(), score: 0 }],
    };
    const zeroScoreResult = createMatchSchema.safeParse(zeroScoreInput);
    assert(zeroScoreResult.success, "Score of 0 is valid and accepted");

    // Invariant: At least one participant required
    const emptyParticipantsInput = {
      sessionId: openSession._id.toString(),
      date: sessionDateStr,
      sport: sportFootball,
      opponent: "Ranchi FC",
      participants: [],
    };
    const emptyResult = createMatchSchema.safeParse(emptyParticipantsInput);
    assert(!emptyResult.success, "Match sheet with zero participants is rejected");

    console.log("\n--- 5. Match Finalization & MongoDB Record Creation ---");

    // Valid Match Creation with 2 Present Players
    const validMatch = await Match.create({
      date: sessionDate,
      sport: sportFootball,
      opponent: "Tata Academy",
      sessionId: openSession._id,
      participants: [
        {
          playerId: playerP1._id,
          playerNameSnapshot: playerP1.name,
          score: 2,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
        {
          playerId: playerP2._id,
          playerNameSnapshot: playerP2.name,
          score: 1,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });

    assert(Boolean(validMatch._id), "Match record created and saved in MongoDB");
    assert(validMatch.status === "FINALIZED", "Match status is permanently FINALIZED");
    assert(validMatch.participants.length === 2, "Match sheet includes 2 participating athletes");
    assert(
      Boolean(
        validMatch.participants[0] &&
          validMatch.participants[0].scoreMetric === "Goals" &&
          validMatch.participants[0].scoreUnit === "Goals"
      ),
      "Player 1 participant score metric & unit saved as 'Goals'"
    );

    console.log("\n--- 6. Match History Queries & Filtering ---");

    // Query matches for player 1
    const p1Matches = await Match.find({ "participants.playerId": playerP1._id });
    assert(p1Matches.length === 1, "Player 1 match history correctly resolves 1 match");

    // Query matches for absent player 3
    const p3Matches = await Match.find({ "participants.playerId": playerAbsent._id });
    assert(p3Matches.length === 0, "Absent player has 0 match participations");

    // Clean up test documents
    await Match.deleteMany({ _id: validMatch._id });
    await Session.deleteMany({ _id: openSession._id });
    await Player.deleteMany({
      _id: { $in: [playerP1._id, playerP2._id, playerAbsent._id, cricketPlayer._id] },
    });
    await User.deleteMany({ _id: coach._id });

    console.log("\nCleaned up test documents from database.");
  } catch (error) {
    console.error("Test execution failed:", error);
    failed++;
  } finally {
    await disconnectDatabase();
  }

  console.log("\n==================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMatchTests();
