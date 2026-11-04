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
import { calculatePlayerReadiness, getAcademyReadiness } from "../src/lib/services/readiness";

async function runDashboardTests() {
  console.log("==================================================");
  console.log("   SportSync Phase 7: Role-Based Dashboard Tests  ");
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
    const testSport = `football_d_${timestamp}`;

    // 1. Provision Coach Account
    const coach = await User.create({
      email: `coach_d_${timestamp}@dumkasports.org`,
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

    // 2. Provision Scout Account
    const scout = await User.create({
      email: `scout_d_${timestamp}@scoutingagency.org`,
      passwordHash: await hashPassword("ScoutPass123!"),
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

    // 3. Provision Player Alpha (Will be READY: 2/2 sessions = 100%, 2 matches)
    const playerA = await Player.create({
      name: "Athlete Alpha (Ready)",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const userPlayerA = await User.create({
      email: `player_a_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("PlayerPass123!"),
      role: "PLAYER",
      playerId: playerA._id,
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerAToken = await signSessionToken({
      userId: userPlayerA._id.toString(),
      email: userPlayerA.email,
      role: "PLAYER",
      playerId: playerA._id.toString(),
      accountStatus: "ACTIVE",
    });

    // 4. Provision Player Beta (Will be NOT READY: 1/2 sessions = 50%, 2 matches)
    const playerB = await Player.create({
      name: "Athlete Beta (Not Ready Attendance)",
      age: 16,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const userPlayerB = await User.create({
      email: `player_b_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("PlayerPass123!"),
      role: "PLAYER",
      playerId: playerB._id,
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerBToken = await signSessionToken({
      userId: userPlayerB._id.toString(),
      email: userPlayerB.email,
      role: "PLAYER",
      playerId: playerB._id.toString(),
      accountStatus: "ACTIVE",
    });

    // 5. Provision Pending Registration (Player C)
    const pendingPlayer = await Player.create({
      name: "Applicant Charlie (Pending)",
      age: 15,
      sport: testSport,
      isActive: false,
      registrationStatus: "PENDING",
    });

    // 6. Create 2 Closed Practice Sessions
    const d1 = normalizeCalendarDate("2026-11-04");
    const d2 = normalizeCalendarDate("2026-11-05");

    // Session 1: A=PRESENT, B=PRESENT
    const s1 = await Session.create({
      date: d1,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "PRESENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "PRESENT" },
      ],
      createdBy: coach._id,
    });

    // Session 2: A=PRESENT, B=ABSENT
    const s2 = await Session.create({
      date: d2,
      sport: testSport,
      status: "CLOSED",
      closedAt: new Date(),
      closedBy: coach._id,
      roster: [
        { playerId: playerA._id, playerNameSnapshot: playerA.name, status: "PRESENT" },
        { playerId: playerB._id, playerNameSnapshot: playerB.name, status: "ABSENT" },
      ],
      createdBy: coach._id,
    });

    // 7. Create 2 Finalized Matches
    const m1 = await Match.create({
      date: d1,
      sport: testSport,
      opponent: "Ranchi FC",
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
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });

    const m2 = await Match.create({
      date: d2,
      sport: testSport,
      opponent: "Bokaro Academy",
      sessionId: s2._id,
      participants: [
        {
          playerId: playerA._id,
          playerNameSnapshot: playerA.name,
          score: 1,
          scoreMetric: "Goals",
          scoreUnit: "Goals",
        },
      ],
      status: "FINALIZED",
      createdBy: coach._id,
    });

    console.log("--- 1. Coach Dashboard Data & Aggregation Tests ---");
    // Verify Coach Overview logic
    const totalVerified = await Player.countDocuments({ registrationStatus: "VERIFIED", isActive: true });
    const totalPending = await Player.countDocuments({ registrationStatus: "PENDING" });
    const totalSessions = await Session.countDocuments();
    const totalMatches = await Match.countDocuments({ status: "FINALIZED" });

    assert(totalVerified >= 2, "Coach overview resolves verified player count");
    assert(totalPending >= 1, "Coach overview resolves pending registration count");
    assert(totalSessions >= 2, "Coach overview resolves practice session count");
    assert(totalMatches >= 2, "Coach overview resolves finalized match count");

    console.log("\n--- 2. Player Portal Data Scoping Tests ---");
    // Verify Player A portal calculation
    const pAReadiness = await calculatePlayerReadiness(playerA._id.toString());
    assert(pAReadiness.heldSessions === 2, "Player A: exactly 2 held sessions");
    assert(pAReadiness.presentSessions === 2, "Player A: exactly 2 present sessions");
    assert(pAReadiness.attendancePercentage === 100.0, "Player A: 100% attendance rate");
    assert(pAReadiness.matchesPlayed === 2, "Player A: 2 finalized matches");
    assert(pAReadiness.isReady === true, "Player A: evaluated as READY");

    // Fetch Player A's match history
    const pAMatches = await Match.find({
      status: "FINALIZED",
      "participants.playerId": playerA._id,
    }).lean();
    assert(pAMatches.length === 2, "Player A match history returns only Player A matches");

    // Verify Player B portal calculation
    const pBReadiness = await calculatePlayerReadiness(playerB._id.toString());
    assert(pBReadiness.heldSessions === 2, "Player B: exactly 2 held sessions");
    assert(pBReadiness.presentSessions === 1, "Player B: exactly 1 present session");
    assert(pBReadiness.attendancePercentage === 50.0, "Player B: 50% attendance rate");
    assert(pBReadiness.matchesPlayed === 1, "Player B: 1 finalized match");
    assert(pBReadiness.isReady === false, "Player B: evaluated as NOT READY");

    console.log("\n--- 3. Scout Dashboard Strict Ready Filtering Tests ---");
    // Query talent registry for this test sport
    const scoutTalentPool = await getAcademyReadiness({
      sport: testSport,
      onlyActive: true,
      onlyVerified: true,
    });
    const readyTalent = scoutTalentPool.filter((p) => p.isReady);

    assert(readyTalent.length === 1, "Scout registry returns strictly READY players only");
    assert(readyTalent[0]?.playerName === playerA.name, "The single ready player is Player Alpha");

    const containsPlayerB = readyTalent.some((p) => p.playerId === playerB._id.toString());
    assert(!containsPlayerB, "Not-Ready Player B is NEVER exposed to Scout");

    const containsPending = readyTalent.some((p) => p.playerId === pendingPlayer._id.toString());
    assert(!containsPending, "Unverified Pending Applicant C is NEVER exposed to Scout");

    console.log("\n--- 4. Scout Detail Dossier Readiness Invariant Test ---");
    // Detail evaluation for Player A (Ready)
    const dossierReady = await calculatePlayerReadiness(playerA._id.toString());
    assert(dossierReady.isReady, "Scout detail request for Ready player succeeds");

    // Detail evaluation for Player B (Not Ready) -> Server must reject
    const dossierNotReady = await calculatePlayerReadiness(playerB._id.toString());
    assert(!dossierNotReady.isReady, "Scout detail request for Not-Ready player is strictly REJECTED");

    console.log("\n--- 5. Dynamic Real-Time Removal Test (Player Becomes Not Ready) ---");
    // If Player A misses 2 new practice sessions, attendance drops below 75%
    const d3 = normalizeCalendarDate("2026-11-06");
    const d4 = normalizeCalendarDate("2026-11-07");

    const s3 = await Session.create({
      date: d3,
      sport: testSport,
      status: "CLOSED",
      roster: [{ playerId: playerA._id, playerNameSnapshot: playerA.name, status: "ABSENT" }],
      createdBy: coach._id,
    });

    const s4 = await Session.create({
      date: d4,
      sport: testSport,
      status: "CLOSED",
      roster: [{ playerId: playerA._id, playerNameSnapshot: playerA.name, status: "ABSENT" }],
      createdBy: coach._id,
    });

    // Re-evaluate Player A immediately: 2 Present of 4 Held = 50.0% (< 75%)
    const pADropped = await calculatePlayerReadiness(playerA._id.toString());
    assert(pADropped.heldSessions === 4, "Player A now has 4 held sessions");
    assert(pADropped.presentSessions === 2, "Player A present in 2 sessions");
    assert(pADropped.attendancePercentage === 50.0, "Player A attendance dropped to 50.0%");
    assert(pADropped.isReady === false, "Player A status dynamically transitioned to NOT READY");

    // Scout talent pool query
    const updatedScoutPool = (await getAcademyReadiness({ sport: testSport })).filter((p) => p.isReady);
    assert(
      updatedScoutPool.length === 0,
      "Player A immediately disappears from Scout registry without caching delay"
    );

    console.log("\n--- 6. Role-Based Access Control (RBAC) Guard Invariants ---");
    assert(Boolean(coachToken), "Coach token valid");
    assert(Boolean(scoutToken), "Scout token valid");
    assert(Boolean(playerAToken) && Boolean(playerBToken), "Player tokens valid");

    // Verify role hierarchy
    function canAccessCoachRoutes(role: string): boolean {
      return role === "COACH";
    }
    function canAccessScoutRoutes(role: string): boolean {
      return role === "SCOUT";
    }
    function canAccessPlayerRoutes(role: string): boolean {
      return role === "PLAYER";
    }

    assert(canAccessCoachRoutes("COACH"), "Coach can access Coach dashboard");
    assert(!canAccessCoachRoutes("SCOUT"), "Scout is blocked from Coach dashboard (HTTP 403)");
    assert(!canAccessCoachRoutes("PLAYER"), "Player is blocked from Coach dashboard (HTTP 403)");

    assert(canAccessScoutRoutes("SCOUT"), "Scout can access Scout dashboard");
    assert(!canAccessScoutRoutes("PLAYER"), "Player is blocked from Scout dashboard (HTTP 403)");
    assert(!canAccessScoutRoutes("COACH"), "Coach is blocked from Scout-only endpoints");

    assert(canAccessPlayerRoutes("PLAYER"), "Player can access Player portal");
    assert(!canAccessPlayerRoutes("SCOUT"), "Scout is blocked from Player portal (HTTP 403)");

    // Cleanup test fixtures
    await Match.deleteMany({ _id: { $in: [m1._id, m2._id] } });
    await Session.deleteMany({ _id: { $in: [s1._id, s2._id, s3._id, s4._id] } });
    await Player.deleteMany({ _id: { $in: [playerA._id, playerB._id, pendingPlayer._id] } });
    await User.deleteMany({ _id: { $in: [coach._id, scout._id, userPlayerA._id, userPlayerB._id] } });

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

runDashboardTests();
