import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { Session } from "../src/models/Session";
import { Match } from "../src/models/Match";
import { hashPassword } from "../src/lib/auth/password";
import { normalizeCalendarDate } from "../src/lib/utils/date";
import {
  evaluateReadiness,
  calculatePlayerReadiness,
  getAcademyReadiness,
} from "../src/lib/services/readiness";

async function runReadinessTests() {
  console.log("==================================================");
  console.log("    SportSync Phase 6: Player Readiness Tests     ");
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

  // --- 1. Pure Boundary & Mathematical Tests ---
  console.log("--- 1. Mathematical Boundary Tests (Unrounded Ratio & Match Criteria) ---");

  // 1A. Exactly 74.999% attendance (below 75%) with 2 matches -> NOT READY
  const below75 = evaluateReadiness(100000, 74999, 2);
  assert(
    below75.rawAttendanceRatio === 0.74999,
    "Calculates exact unrounded ratio 0.74999"
  );
  assert(!below75.isAttendanceEligible, "74.999% is strictly below 75% threshold");
  assert(below75.isMatchesEligible, "2 matches meets matches condition");
  assert(!below75.isReady, "Player with 74.999% attendance and 2 matches is NOT READY");

  // 1B. Exactly 75.0% attendance (3/4) with 2 matches -> READY
  const exactly75 = evaluateReadiness(4, 3, 2);
  assert(exactly75.rawAttendanceRatio === 0.75, "Calculates exact ratio 0.75 (75.0%)");
  assert(exactly75.isAttendanceEligible, "75.0% meets attendance condition");
  assert(exactly75.isMatchesEligible, "2 matches meets matches condition");
  assert(exactly75.isReady, "Player with exactly 75.0% attendance and 2 matches is READY");

  // 1C. Exactly 75.001% attendance (above 75%) with 2 matches -> READY
  const above75 = evaluateReadiness(100000, 75001, 2);
  assert(above75.isAttendanceEligible, "75.001% meets attendance condition");
  assert(above75.isReady, "Player with 75.001% attendance and 2 matches is READY");

  // 1D. Fewer than 2 matches: 0 matches with 100% attendance -> NOT READY
  const zeroMatches = evaluateReadiness(4, 4, 0);
  assert(zeroMatches.isAttendanceEligible, "100% attendance meets attendance condition");
  assert(!zeroMatches.isMatchesEligible, "0 matches fails match condition (< 2)");
  assert(!zeroMatches.isReady, "Player with 100% attendance but 0 matches is NOT READY");

  // 1E. Fewer than 2 matches: 1 match with 100% attendance -> NOT READY
  const oneMatch = evaluateReadiness(4, 4, 1);
  assert(oneMatch.isAttendanceEligible, "100% attendance meets attendance condition");
  assert(!oneMatch.isMatchesEligible, "1 match fails match condition (< 2)");
  assert(!oneMatch.isReady, "Player with 100% attendance but only 1 match is NOT READY");

  // 1F. Exactly 2 matches with above 75% attendance (4/5 = 80%) -> READY
  const eightyPercent = evaluateReadiness(5, 4, 2);
  assert(eightyPercent.attendancePercentage === 80, "80% attendance formatted properly");
  assert(eightyPercent.isReady, "Player with 80.0% attendance and 2 matches is READY");

  // 1G. Zero held sessions -> 0% attendance, NOT READY
  const zeroHeld = evaluateReadiness(0, 0, 2);
  assert(zeroHeld.rawAttendanceRatio === 0, "Zero held sessions gives 0 ratio");
  assert(zeroHeld.attendancePercentage === 0, "Zero held sessions gives 0.0% attendance");
  assert(!zeroHeld.isReady, "Player with 0 held sessions is NOT READY");

  // --- 2. Live Database Integration Tests ---
  console.log("\n--- 2. Live Database Invariants & Real-Time Calculation ---");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI not found in environment.");
    process.exit(1);
  }

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB Atlas.\n");

    const timestamp = Date.now();
    const coachEmail = `coach_ready_${timestamp}@dumkasports.org`;

    // 1. Provision Coach
    const coach = await User.create({
      email: coachEmail,
      passwordHash: await hashPassword("CoachPass123!"),
      role: "COACH",
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const testSport = `football_r_${timestamp}`;

    // 2. Create 3 Players in the same sport
    // Player A: Will have 3/4 (75%) attendance and 2 matches -> READY
    const playerA = await Player.create({
      name: "Athlete Alpha (75% + 2 Matches)",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    // Player B: Will have 2/4 (50%) attendance and 2 matches -> NOT READY (Attendance deficit)
    const playerB = await Player.create({
      name: "Athlete Beta (50% + 2 Matches)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    // Player C: Will have 4/4 (100%) attendance and 1 match -> NOT READY (Match deficit)
    const playerC = await Player.create({
      name: "Athlete Gamma (100% + 1 Match)",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    // 3. Create 4 Closed Practice Sessions on or after enrollment
    const d1 = normalizeCalendarDate("2026-11-04");
    const d2 = normalizeCalendarDate("2026-11-05");
    const d3 = normalizeCalendarDate("2026-11-06");
    const d4 = normalizeCalendarDate("2026-11-07");

    // Session 1: A=PRESENT, B=PRESENT, C=PRESENT
    const s1 = await Session.create({
      date: d1,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "PRESENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "PRESENT" },
        { playerId: playerC._id, playerNameSnapshot: playerC.name, status: "PRESENT" },
      ],
      createdBy: coach._id,
    });

    // Session 2: A=PRESENT, B=PRESENT, C=PRESENT
    const s2 = await Session.create({
      date: d2,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "PRESENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "PRESENT" },
        { playerId: playerC._id, playerNameSnapshot: playerC.name, status: "PRESENT" },
      ],
      createdBy: coach._id,
    });

    // Session 3: A=PRESENT, B=ABSENT, C=PRESENT
    const s3 = await Session.create({
      date: d3,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "PRESENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "ABSENT" },
        { playerId: playerC._id, playerNameSnapshot: playerC.name, status: "PRESENT" },
      ],
      createdBy: coach._id,
    });

    // Session 4: A=ABSENT, B=ABSENT, C=PRESENT
    const s4 = await Session.create({
      date: d4,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "ABSENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "ABSENT" },
        { playerId: playerC._id, playerNameSnapshot: playerC.name, status: "PRESENT" },
      ],
      createdBy: coach._id,
    });

    // Also create 1 OPEN session to verify it is completely EXCLUDED
    const openSession = await Session.create({
      date: normalizeCalendarDate("2026-11-08"),
      sport: testSport,
      status: "OPEN",
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: null },
      ],
      createdBy: coach._id,
    });

    // 4. Create Finalized Matches
    // Match 1: Player A (Present in s1), Player B (Present in s1), Player C (Present in s1)
    const m1 = await Match.create({
      date: d1,
      sport: testSport,
      opponent: "Ranchi Youth Club",
      sessionId: s1._id,
      participants: [
        {
          playerId: playerA._id,
          playerNameSnapshot: playerA.name,
          score: 2,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
        {
          playerId: playerB._id,
          playerNameSnapshot: playerB.name,
          score: 1,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
        {
          playerId: playerC._id,
          playerNameSnapshot: playerC.name,
          score: 0,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });

    // Match 2: Player A (Present in s2) and Player B (Present in s2) [Player C does NOT participate]
    const m2 = await Match.create({
      date: d2,
      sport: testSport,
      opponent: "Tata Steel Academy",
      sessionId: s2._id,
      participants: [
        {
          playerId: playerA._id,
          playerNameSnapshot: playerA.name,
          score: 1,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
        {
          playerId: playerB._id,
          playerNameSnapshot: playerB.name,
          score: 0,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });

    // 5. Verify Player A Readiness (3/4 = 75.0% Attendance, 2 Matches)
    console.log("\n--- Checking Athlete Alpha (Target: READY) ---");
    const rA = await calculatePlayerReadiness(playerA._id.toString());
    assert(rA.heldSessions === 4, "Athlete A has 4 eligible closed sessions (open session excluded)");
    assert(rA.presentSessions === 3, "Athlete A was present in 3 sessions");
    assert(rA.attendancePercentage === 75.0, "Athlete A attendance rate is exactly 75.0%");
    assert(rA.matchesPlayed === 2, "Athlete A has 2 finalized matches");
    assert(rA.isAttendanceEligible, "Athlete A satisfies attendance condition");
    assert(rA.isMatchesEligible, "Athlete A satisfies matches condition");
    assert(rA.isReady === true, "Athlete Alpha is correctly evaluated as READY");

    // 6. Verify Player B Readiness (2/4 = 50.0% Attendance, 2 Matches)
    console.log("\n--- Checking Athlete Beta (Target: NOT READY due to attendance) ---");
    const rB = await calculatePlayerReadiness(playerB._id.toString());
    assert(rB.heldSessions === 4, "Athlete B has 4 eligible closed sessions");
    assert(rB.presentSessions === 2, "Athlete B was present in 2 sessions");
    assert(rB.attendancePercentage === 50.0, "Athlete B attendance rate is 50.0%");
    assert(rB.matchesPlayed === 2, "Athlete B has 2 finalized matches");
    assert(!rB.isAttendanceEligible, "Athlete B fails attendance condition (< 75%)");
    assert(rB.isMatchesEligible, "Athlete B satisfies matches condition");
    assert(rB.isReady === false, "Athlete Beta is correctly evaluated as NOT READY");

    // 7. Verify Player C Readiness (4/4 = 100.0% Attendance, 1 Match)
    console.log("\n--- Checking Athlete Gamma (Target: NOT READY due to match count) ---");
    const rC = await calculatePlayerReadiness(playerC._id.toString());
    assert(rC.heldSessions === 4, "Athlete C has 4 eligible closed sessions");
    assert(rC.presentSessions === 4, "Athlete C was present in 4 sessions");
    assert(rC.attendancePercentage === 100.0, "Athlete C attendance rate is 100.0%");
    assert(rC.matchesPlayed === 1, "Athlete C has only 1 finalized match");
    assert(rC.isAttendanceEligible, "Athlete C satisfies attendance condition");
    assert(!rC.isMatchesEligible, "Athlete C fails matches condition (< 2 matches)");
    assert(rC.isReady === false, "Athlete Gamma is correctly evaluated as NOT READY");

    // 8. Academy Batch Readiness Service Test
    console.log("\n--- Checking Academy Batch Readiness Service ---");
    const batchResults = await getAcademyReadiness({ sport: testSport });
    assert(batchResults.length === 3, "Batch evaluation returns all 3 academy players in sport");
    const readyAthletes = batchResults.filter((p) => p.isReady);
    assert(readyAthletes.length === 1, "Exactly 1 athlete is evaluated as READY in the academy");
    assert(readyAthletes[0]?.playerName === playerA.name, "The single ready athlete is Athlete Alpha");

    // Cleanup test fixtures
    await Match.deleteMany({ _id: { $in: [m1._id, m2._id] } });
    await Session.deleteMany({ _id: { $in: [s1._id, s2._id, s3._id, s4._id, openSession._id] } });
    await Player.deleteMany({ _id: { $in: [playerA._id, playerB._id, playerC._id] } });
    await User.deleteMany({ _id: coach._id });

    console.log("\nCleaned up all test records from database.");
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

runReadinessTests();
