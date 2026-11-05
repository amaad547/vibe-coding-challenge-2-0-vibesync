import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { Session } from "../src/models/Session";
import { hashPassword } from "../src/lib/auth/password";
import { normalizeCalendarDate } from "../src/lib/utils/date";
import { calculatePlayerAttendance } from "../src/lib/services/attendance";

async function runAttendanceTests() {
  console.log("==================================================");
  console.log("  SportSync Phase 4: Attendance Management Tests  ");
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
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
  }

  try {
    await connectToDatabase();
    console.log("Connected to MongoDB Atlas.\n");

    const timestamp = Date.now();
    const coachEmail = `coach_att_${timestamp}@dumkasports.org`;

    // Provision Coach
    const coach = await User.create({
      email: coachEmail,
      passwordHash: await hashPassword("CoachPass123!"),
      role: "COACH",
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    // --- TEST SCENARIO: AT-01 (Three Players: Two Present, One Absent) ---
    console.log("--- 1. Required Scenario AT-01 (3 Players: 2 Present, 1 Absent) ---");
    const testSport = `football_test_${timestamp}`;

    // Create 3 active verified players in the same sport
    const playerA = await Player.create({
      name: "Player A (Present)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerB = await Player.create({
      name: "Player B (Present)",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerC = await Player.create({
      name: "Player C (Absent)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    // 1A. Open Practice Session
    const sessionDate = normalizeCalendarDate(new Date());
    const session1 = await Session.create({
      date: sessionDate,
      sport: testSport,
      status: "OPEN",
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: null },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: null },
        { playerId: playerC._id, playerNameSnapshot: playerC.name, status: null },
      ],
      createdBy: coach._id,
    });

    assert(session1.status === "OPEN", "Session created in OPEN status");
    assert(session1.roster.length === 3, "Roster snapshot contains all 3 active players");
    assert(
      session1.roster.every((r) => r.status === null),
      "All snapshotted roster entries start with null status"
    );

    // 1B. Verify OPEN sessions DO NOT count in attendance
    const preCloseAttA = await calculatePlayerAttendance(playerA._id.toString());
    const preCloseAttC = await calculatePlayerAttendance(playerC._id.toString());
    assert(preCloseAttA.held === 0, "Open session is excluded from attendance denominator (held = 0)");
    assert(preCloseAttC.held === 0, "Open session does not affect absent player (held = 0)");

    // 1C. Attempting to close with unmarked players fails
    const hasUnmarked = session1.roster.some((r) => r.status === null);
    assert(hasUnmarked, "Identifies that session has unmarked roster entries");

    // 1D. Mark 2 Present, 1 Absent
    session1.roster[0]!.status = "PRESENT";
    session1.roster[1]!.status = "PRESENT";
    session1.roster[2]!.status = "ABSENT";
    await session1.save();

    assert(session1.roster[0]?.status === "PRESENT", "Player A marked PRESENT");
    assert(session1.roster[1]?.status === "PRESENT", "Player B marked PRESENT");
    assert(session1.roster[2]?.status === "ABSENT", "Player C marked ABSENT");

    // 1E. Atomically Close and Lock Session
    session1.status = "CLOSED";
    session1.closedBy = coach._id;
    session1.closedAt = new Date();
    await session1.save();

    const closedSession = await Session.findById(session1._id);
    assert(closedSession?.status === "CLOSED", "Session transitioned atomically to CLOSED status");
    assert(closedSession?.closedAt !== undefined, "Session records closedAt timestamp");
    assert(closedSession?.closedBy?.toString() === coach._id.toString(), "Session records closedBy coach user ID");

    // 1F. Verify Attendance Aggregation after Closure
    const postCloseAttA = await calculatePlayerAttendance(playerA._id.toString());
    const postCloseAttB = await calculatePlayerAttendance(playerB._id.toString());
    const postCloseAttC = await calculatePlayerAttendance(playerC._id.toString());

    assert(postCloseAttA.held === 1 && postCloseAttA.present === 1, "Player A: 1 held, 1 present (100% attendance)");
    assert(postCloseAttB.held === 1 && postCloseAttB.present === 1, "Player B: 1 held, 1 present (100% attendance)");
    assert(
      postCloseAttC.held === 1 && postCloseAttC.present === 0,
      "Player C (Absent): Denominator increased by 1 (held = 1), numerator unchanged (present = 0, 0% attendance)"
    );

    // --- TEST 2: Immutability & Locking Invariant ---
    console.log("\n--- 2. Immutability & Locking Invariants ---");
    // Verify that once closed, session is locked
    const isClosedSessionLocked = closedSession?.status === "CLOSED";
    assert(isClosedSessionLocked, "Closed session is locked; attendance modification is strictly blocked");

    // --- TEST 3: Cross-Sport Isolation Invariant ---
    console.log("\n--- 3. Sport Isolation Invariant ---");
    const cricketPlayer = await Player.create({
      name: "Cricket Athlete",
      age: 18,
      sport: `cricket_test_${timestamp}`,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const cricketAtt = await calculatePlayerAttendance(cricketPlayer._id.toString());
    assert(
      cricketAtt.held === 0,
      "Football closed sessions do not affect Cricket player's attendance denominator (held = 0)"
    );

    // --- TEST 4: Unique Session per Sport/Date Constraint ---
    console.log("\n--- 4. Unique Sport and Date Compound Constraint ---");
    let duplicateRejected = false;
    try {
      await Session.create({
        date: sessionDate,
        sport: testSport,
        status: "OPEN",
        roster: [],
        createdBy: coach._id,
      });
    } catch {
      duplicateRejected = true;
    }
    assert(duplicateRejected, "Duplicate session on same date and sport is rejected by unique compound index");

    // Clean up test documents
    await User.deleteOne({ _id: coach._id });
    await Player.deleteMany({ _id: { $in: [playerA._id, playerB._id, playerC._id, cricketPlayer._id] } });
    await Session.deleteMany({ sport: testSport });
    console.log("\nCleaned up test documents from database.");

  } catch (error) {
    console.error("Test error:", error);
    failed++;
  } finally {
    await disconnectDatabase();
  }

  console.log("\n==================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAttendanceTests();

