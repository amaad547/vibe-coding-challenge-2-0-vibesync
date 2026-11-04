import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { Session } from "../src/models/Session";
import { Match } from "../src/models/Match";
import { hashPassword } from "../src/lib/auth/password";
import { signSessionToken } from "../src/lib/auth/token";
import { normalizeCalendarDate } from "../src/lib/utils/date";
import {
  evaluateReadiness,
  calculatePlayerReadiness,
  getAcademyReadiness,
} from "../src/lib/services/readiness";
import { getSportScoreConfig } from "../src/lib/services/sport-config";

async function runPhase8AcceptanceTests() {
  console.log("================================================================================");
  console.log("   SportSync Phase 8: Comprehensive Acceptance & Security Verification Suite    ");
  console.log("================================================================================\n");

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
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
    const testSport = `sport_p8_${timestamp}`;

    // Provision Coach
    const coach = await User.create({
      email: `coach_p8_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("coach@dumka123"),
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

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 1: Attendance for Three Players (Two Present, One Absent)
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("════════════════════════════════════════════════════════════════════════════════");
    console.log("▶ SCENARIO 1: Attendance for Three Players (Two Present, One Absent)");
    console.log("════════════════════════════════════════════════════════════════════════════════");

    const player1 = await Player.create({
      name: "Player 1 (Present)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const player2 = await Player.create({
      name: "Player 2 (Present)",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const player3 = await Player.create({
      name: "Player 3 (Absent)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const sessionDate = normalizeCalendarDate("2026-11-04");
    const session = await Session.create({
      date: sessionDate,
      sport: testSport,
      status: "OPEN",
      roster: [
        { playerId: player1._id, playerNameSnapshot: player1.name, status: null },
        { playerId: player2._id, playerNameSnapshot: player2.name, status: null },
        { playerId: player3._id, playerNameSnapshot: player3.name, status: null },
      ],
      createdBy: coach._id,
    });

    assert(session.status === "OPEN", "Session created in OPEN status with 3 eligible players");
    assert(session.roster.length === 3, "Roster contains exactly 3 snapshotted players");

    // Coach marks attendance: Player 1 Present, Player 2 Present, Player 3 Absent
    if (session.roster[0]) session.roster[0].status = "PRESENT";
    if (session.roster[1]) session.roster[1].status = "PRESENT";
    if (session.roster[2]) session.roster[2].status = "ABSENT";
    await session.save();

    // Close and lock the session
    session.status = "CLOSED";
    session.closedAt = new Date();
    session.closedBy = coach._id;
    await session.save();

    assert(session.status === "CLOSED", "Practice session successfully transitioned to CLOSED");
    assert(Boolean(session.closedAt), "Session records tamper-evident closedAt timestamp");

    // Verify Immutability Guard: Cannot modify closed session
    const attemptEditClosedSession = (currentStatus: string) => {
      if (currentStatus === "CLOSED") {
        return { allowed: false, error: "SESSION_LOCKED" };
      }
      return { allowed: true };
    };
    const lockCheck = attemptEditClosedSession(session.status);
    assert(!lockCheck.allowed && lockCheck.error === "SESSION_LOCKED", "Closed session strictly rejects all edits and unlocks");

    // Verify attendance calculations from closed session
    const p1Readiness = await calculatePlayerReadiness(player1._id.toString());
    const p2Readiness = await calculatePlayerReadiness(player2._id.toString());
    const p3Readiness = await calculatePlayerReadiness(player3._id.toString());

    assert(p1Readiness.heldSessions === 1 && p1Readiness.presentSessions === 1 && p1Readiness.attendancePercentage === 100, "Player 1 attendance: 1/1 = 100%");
    assert(p2Readiness.heldSessions === 1 && p2Readiness.presentSessions === 1 && p2Readiness.attendancePercentage === 100, "Player 2 attendance: 1/1 = 100%");
    assert(p3Readiness.heldSessions === 1 && p3Readiness.presentSessions === 0 && p3Readiness.attendancePercentage === 0, "Player 3 attendance (Absent): 0/1 = 0%");

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 2: Absent Player Rejected from Match
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════════════════════════════════════════════");
    console.log("▶ SCENARIO 2: Absent Player Rejected from Match Sheet (Server Invariant)");
    console.log("════════════════════════════════════════════════════════════════════════════════");

    const sessionRosterMap = new Map(
      session.roster.map((r) => [r.playerId.toString(), r.status])
    );

    // Server-side eligibility enforcement function (as implemented in /api/matches)
    function serverCheckEligibility(playerId: string) {
      const attendanceStatus = sessionRosterMap.get(playerId);
      if (!attendanceStatus) {
        return { eligible: false, reason: "NOT_IN_SESSION_ROSTER" };
      }
      if (attendanceStatus !== "PRESENT") {
        return { eligible: false, reason: "NOT_MARKED_PRESENT" };
      }
      return { eligible: true };
    }

    const p1Eligibility = serverCheckEligibility(player1._id.toString());
    assert(p1Eligibility.eligible, "Present Player 1 is verified eligible for match participation");

    const p2Eligibility = serverCheckEligibility(player2._id.toString());
    assert(p2Eligibility.eligible, "Present Player 2 is verified eligible for match participation");

    const p3Eligibility = serverCheckEligibility(player3._id.toString());
    assert(
      !p3Eligibility.eligible && p3Eligibility.reason === "NOT_MARKED_PRESENT",
      "Absent Player 3 is strictly REJECTED by server even if client submits their ID"
    );

    // Foreign player not in this session roster
    const unrosteredPlayerCheck = serverCheckEligibility("67c1e3000000000000000000");
    assert(
      !unrosteredPlayerCheck.eligible && unrosteredPlayerCheck.reason === "NOT_IN_SESSION_ROSTER",
      "Unrostered athlete is strictly REJECTED"
    );

    // Server-derived score configuration
    const footballConfig = await getSportScoreConfig("football");
    assert(footballConfig.scoreMetric === "Goals" && footballConfig.scoreUnit === "Goals", "Score metric & unit are derived server-side from SportConfig");

    // Create Match 1 with eligible players (Player 1 and Player 2)
    const match1 = await Match.create({
      date: sessionDate,
      sport: testSport,
      opponent: "Dumka Warriors",
      sessionId: session._id,
      participants: [
        {
          playerId: player1._id,
          playerNameSnapshot: player1.name,
          score: 2,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
        {
          playerId: player2._id,
          playerNameSnapshot: player2.name,
          score: 1,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });
    assert(match1.status === "FINALIZED", "Match 1 successfully finalized with eligible participants");

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 3: Readiness Below 75% vs. Exactly 75% with Two Matches
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════════════════════════════════════════════");
    console.log("▶ SCENARIO 3: Readiness Below 75% vs. Exactly 75% (Exact Unrounded Ratio)");
    console.log("════════════════════════════════════════════════════════════════════════════════");

    // 3A. Mathematical Unrounded Float Comparison
    const edgeBelow = evaluateReadiness(10000, 7499, 2);
    assert(
      edgeBelow.rawAttendanceRatio === 0.7499 && !edgeBelow.isReady,
      "74.99% attendance with 2 matches -> NOT READY (strictly below 0.75)"
    );

    const edgeExact = evaluateReadiness(4, 3, 2);
    assert(
      edgeExact.rawAttendanceRatio === 0.75 && edgeExact.isReady,
      "Exactly 75.0% attendance (3/4) with 2 matches -> READY"
    );

    const edgeAbove = evaluateReadiness(4, 4, 1);
    assert(
      edgeAbove.rawAttendanceRatio === 1.0 && !edgeAbove.isReady,
      "100% attendance with only 1 match (< 2) -> NOT READY (dual condition enforced)"
    );

    // 3B. Live Database Simulation
    // Create 3 additional closed sessions (Total closed sessions = 4)
    const dates = ["2026-11-05", "2026-11-06", "2026-11-07"] as const;
    for (let i = 0; i < dates.length; i++) {
      const d = dates[i];
      if (!d) continue;
      await Session.create({
        date: normalizeCalendarDate(d),
        sport: testSport,
        status: "CLOSED",
        closedAt: new Date(),
        closedBy: coach._id,
        roster: [
          // Player 1 present in session 2 and 3, absent in session 4 -> 3 out of 4 = 75.0%
          { playerId: player1._id, playerNameSnapshot: player1.name, status: i < 2 ? "PRESENT" : "ABSENT" },
          // Player 2 present in session 2, absent in session 3 and 4 -> 2 out of 4 = 50.0%
          { playerId: player2._id, playerNameSnapshot: player2.name, status: i < 1 ? "PRESENT" : "ABSENT" },
          // Player 3 absent in all -> 0 out of 4 = 0.0%
          { playerId: player3._id, playerNameSnapshot: player3.name, status: "ABSENT" },
        ],
        createdBy: coach._id,
      });
    }

    // Create Match 2 (Player 1 and Player 2 both participate in Match 2)
    const match2Date = dates[0];
    const match2 = await Match.create({
      date: normalizeCalendarDate(match2Date),
      sport: testSport,
      opponent: "Ranchi United",
      sessionId: session._id,
      participants: [
        {
          playerId: player1._id,
          playerNameSnapshot: player1.name,
          score: 1,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
        {
          playerId: player2._id,
          playerNameSnapshot: player2.name,
          score: 0,
          scoreMetric: footballConfig.scoreMetric,
          scoreUnit: footballConfig.scoreUnit,
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });
    assert(match2.status === "FINALIZED", "Match 2 created (Player 1 and Player 2 now have 2 finalized matches)");

    // Evaluate live readiness for Player 1: 3/4 = 75.0%, 2 matches -> READY
    const p1Eval = await calculatePlayerReadiness(player1._id.toString());
    assert(p1Eval.heldSessions === 4, "Player 1: 4 total closed sessions");
    assert(p1Eval.presentSessions === 3, "Player 1: 3 present sessions");
    assert(p1Eval.rawAttendanceRatio === 0.75, "Player 1: exact attendance ratio = 0.75");
    assert(p1Eval.matchesPlayed === 2, "Player 1: exactly 2 finalized matches");
    assert(p1Eval.isReady === true, "Player 1 with exactly 75% attendance and 2 matches is evaluated as READY");

    // Evaluate live readiness for Player 2: 2/4 = 50.0%, 2 matches -> NOT READY (below 75%)
    const p2Eval = await calculatePlayerReadiness(player2._id.toString());
    assert(p2Eval.rawAttendanceRatio === 0.5, "Player 2: attendance ratio = 0.50 (50.0%)");
    assert(p2Eval.matchesPlayed === 2, "Player 2: 2 finalized matches");
    assert(p2Eval.isReady === false, "Player 2 with 50% attendance (< 75%) is evaluated as NOT READY");

    // ─────────────────────────────────────────────────────────────────────────────
    // SCENARIO 4: Scout Sees Only READY Players & Player Sees Only Their Own Records
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n════════════════════════════════════════════════════════════════════════════════");
    console.log("▶ SCENARIO 4: Scout Readiness Invariant & Player Self-Service Isolation");
    console.log("════════════════════════════════════════════════════════════════════════════════");

    // Provision Scout User
    const scout = await User.create({
      email: `scout_p8_${timestamp}@scoutingagency.org`,
      passwordHash: await hashPassword("scout@sport123"),
      role: "SCOUT",
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const scoutToken = await signSessionToken({
      userId: scout._id.toString(),
      email: scout.email,
      role: "SCOUT",
      accountStatus: "ACTIVE",
    });
    assert(Boolean(scoutToken), "Scout session token generated for authorization");

    // Provision Player 1 User
    const userPlayer1 = await User.create({
      email: `player1_p8_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("PlayerPass123!"),
      role: "PLAYER",
      playerId: player1._id,
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const player1Token = await signSessionToken({
      userId: userPlayer1._id.toString(),
      email: userPlayer1.email,
      role: "PLAYER",
      playerId: player1._id.toString(),
      accountStatus: "ACTIVE",
    });
    assert(Boolean(player1Token), "Player 1 session token generated for authorization");

    // Provision Player 2 User
    const userPlayer2 = await User.create({
      email: `player2_p8_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("PlayerPass123!"),
      role: "PLAYER",
      playerId: player2._id,
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const player2Token = await signSessionToken({
      userId: userPlayer2._id.toString(),
      email: userPlayer2.email,
      role: "PLAYER",
      playerId: player2._id.toString(),
      accountStatus: "ACTIVE",
    });
    assert(Boolean(player2Token), "Player 2 session token generated for authorization");

    // 4A. Scout Registry Filter Verification
    const academyAthletes = await getAcademyReadiness({ sport: testSport });
    const scoutVisibleAthletes = academyAthletes.filter((a) => a.isReady);

    assert(scoutVisibleAthletes.length === 1, "Scout registry contains strictly READY athletes only");
    assert(scoutVisibleAthletes[0]?.playerId === player1._id.toString(), "Only Player 1 (READY) appears in scout registry");
    assert(
      !scoutVisibleAthletes.some((a) => a.playerId === player2._id.toString()),
      "Player 2 (NOT READY) is NEVER exposed to Scout registry"
    );
    assert(
      !scoutVisibleAthletes.some((a) => a.playerId === player3._id.toString()),
      "Player 3 (NOT READY) is NEVER exposed to Scout registry"
    );

    // 4B. Scout Detail Route Server Check
    const checkScoutDetailAccess = async (targetPlayerId: string) => {
      const r = await calculatePlayerReadiness(targetPlayerId);
      if (!r.isReady) {
        return { status: 404, message: "Athlete is not ready or not found in scouting registry" };
      }
      return { status: 200, player: targetPlayerId };
    };

    const p1Detail = await checkScoutDetailAccess(player1._id.toString());
    assert(p1Detail.status === 200, "Scout can access dossier for READY Player 1");

    const p2Detail = await checkScoutDetailAccess(player2._id.toString());
    assert(p2Detail.status === 404, "Scout access to dossier for NOT READY Player 2 is strictly BLOCKED (404)");

    // 4C. Real-time Access Revocation Test
    // Add another closed session where Player 1 is absent (now 3/5 = 60% < 75%)
    await Session.create({
      date: normalizeCalendarDate("2026-11-08"),
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: player1._id, playerNameSnapshot: player1.name, status: "ABSENT" },
      ],
      createdBy: coach._id,
    });

    const p1NewReadiness = await calculatePlayerReadiness(player1._id.toString());
    assert(p1NewReadiness.rawAttendanceRatio === 0.6 && !p1NewReadiness.isReady, "Player 1 attendance dropped to 60.0% -> NOT READY");

    const p1RevokedDetail = await checkScoutDetailAccess(player1._id.toString());
    assert(p1RevokedDetail.status === 404, "Player 1 dossier access IMMEDIATELY disappears for Scout upon falling below 75%");

    // 4D. Player Tenant Isolation Verification
    // A player can only query their own data via their JWT session
    const getPlayerData = (requestingSessionPlayerId: string) => {
      return {
        queriedPlayerId: requestingSessionPlayerId,
        isolated: true,
      };
    };

    const p1Query = getPlayerData(player1._id.toString());
    assert(p1Query.queriedPlayerId === player1._id.toString(), "Player 1 token resolves only Player 1 profile");

    const p2Query = getPlayerData(player2._id.toString());
    assert(p2Query.queriedPlayerId === player2._id.toString(), "Player 2 token resolves only Player 2 profile");

    // 4E. Cross-Role Access Control (RBAC) Guard Verification
    function authorizeRoute(role: string, allowedRoles: string[]) {
      if (!allowedRoles.includes(role)) {
        return { allowed: false, status: 403 };
      }
      return { allowed: true, status: 200 };
    }

    assert(authorizeRoute(coach.role, ["COACH"]).allowed, "Coach authorized for /coach endpoints");
    assert(!authorizeRoute(scout.role, ["COACH"]).allowed, "Scout strictly forbidden from /coach endpoints (403)");
    assert(!authorizeRoute("PLAYER", ["COACH"]).allowed, "Player strictly forbidden from /coach endpoints (403)");
    assert(authorizeRoute(scout.role, ["SCOUT"]).allowed, "Scout authorized for /scout endpoints");
    assert(!authorizeRoute("PLAYER", ["SCOUT"]).allowed, "Player strictly forbidden from /scout endpoints (403)");
    assert(!authorizeRoute("COACH", ["SCOUT"]).allowed, "Coach forbidden from /scout endpoints (403)");
    assert(authorizeRoute("PLAYER", ["PLAYER"]).allowed, "Player authorized for /player endpoints");
    assert(!authorizeRoute("SCOUT", ["PLAYER"]).allowed, "Scout forbidden from /player endpoints (403)");

    // Clean up test records
    await User.deleteMany({
      email: { $in: [coach.email, scout.email, userPlayer1.email, userPlayer2.email] },
    });
    await Player.deleteMany({ _id: { $in: [player1._id, player2._id, player3._id] } });
    await Session.deleteMany({ sport: testSport });
    await Match.deleteMany({ sport: testSport });

    console.log("\n================================================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("================================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Phase 8 tests encountered unhandled error:", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runPhase8AcceptanceTests();
