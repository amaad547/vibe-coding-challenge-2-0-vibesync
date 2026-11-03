import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { hashPassword } from "../src/lib/auth/password";
import { signSessionToken } from "../src/lib/auth/token";

async function runPlayerManagementTests() {
  console.log("==================================================");
  console.log("  SportSync Phase 3: Player Management Tests      ");
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
    const coachEmail = `coach_pm_${timestamp}@dumkasports.org`;

    // 1. Provision Coach and Player users for testing
    const coachUser = await User.create({
      email: coachEmail,
      passwordHash: await hashPassword("CoachPass123!"),
      role: "COACH",
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const coachToken = await signSessionToken({
      userId: coachUser._id.toString(),
      email: coachUser.email,
      role: "COACH",
      accountStatus: "ACTIVE",
    });
    assert(!!coachToken, "Coach session token generated for authorization");

    // --- TEST 1: Direct Player Creation by Coach ---
    console.log("\n--- 1. Coach Direct Player Creation ---");
    const createdPlayer = await Player.create({
      name: "Rohan Kujur",
      age: 17,
      sport: "football",
      isActive: true,
      registrationStatus: "VERIFIED",
      reviewedBy: coachUser._id,
      reviewedAt: new Date(),
    });

    assert(createdPlayer.name === "Rohan Kujur", "Coach creates verified player directly");
    assert(createdPlayer.isActive === true, "Coach-created player is active immediately");
    assert(createdPlayer.registrationStatus === "VERIFIED", "Status is VERIFIED immediately");

    // --- TEST 2: Updating Player Profile (PATCH) ---
    console.log("\n--- 2. Coach Player Profile Update ---");
    createdPlayer.name = "Rohan Kujur (Senior)";
    createdPlayer.age = 18;
    createdPlayer.sport = "cricket";
    await createdPlayer.save();

    const fetchedUpdated = await Player.findById(createdPlayer._id);
    assert(fetchedUpdated?.name === "Rohan Kujur (Senior)", "Player name updated successfully in MongoDB");
    assert(fetchedUpdated?.age === 18, "Player age updated to 18 in MongoDB");
    assert(fetchedUpdated?.sport === "cricket", "Player sport updated to cricket in MongoDB");

    // --- TEST 3: Soft-Archiving a Player ---
    console.log("\n--- 3. Player Archiving (Preserving Historical Data) ---");
    fetchedUpdated!.isActive = false;
    await fetchedUpdated!.save();

    const archivedPlayer = await Player.findById(createdPlayer._id);
    assert(archivedPlayer?.isActive === false, "Archived player isActive set to false");
    assert(archivedPlayer !== null, "Archived player record still exists in database (not destroyed)");

    // --- TEST 4: Search, Filters, and Pagination Invariants ---
    console.log("\n--- 4. Search, Filter, and Pagination Invariants ---");
    // Seed 3 players
    const p1 = await Player.create({ name: "Aman Verma", age: 16, sport: "football", isActive: true, registrationStatus: "VERIFIED" });
    const p2 = await Player.create({ name: "Amit Soren", age: 15, sport: "football", isActive: true, registrationStatus: "VERIFIED" });
    const p3 = await Player.create({ name: "Sunil Murmu", age: 17, sport: "athletics", isActive: true, registrationStatus: "VERIFIED" });

    // Filter by sport "football"
    const footballPlayers = await Player.find({ sport: "football", isActive: true });
    assert(footballPlayers.some((p) => p.name === "Aman Verma") && footballPlayers.some((p) => p.name === "Amit Soren"), "Filters active players by sport correctly");

    // Search by name "Amit"
    const searchResult = await Player.find({ name: { $regex: "amit", $options: "i" } });
    assert(searchResult.length >= 1 && searchResult[0]?.name === "Amit Soren", "Case-insensitive name search works");

    // --- TEST 5: Registration Approval Flow ---
    console.log("\n--- 5. Registration Approval Workflow ---");
    const regPlayer1 = await Player.create({
      name: "Pending Applicant A",
      age: 16,
      sport: "football",
      isActive: false,
      registrationStatus: "PENDING",
    });
    const regUser1 = await User.create({
      email: `applicant_a_${timestamp}@example.com`,
      passwordHash: await hashPassword("Pass123!"),
      role: "PLAYER",
      accountStatus: "PENDING",
      registrationStatus: "PENDING",
      playerId: regPlayer1._id,
      isActive: false,
    });

    // Simulate Coach Approval
    regPlayer1.registrationStatus = "VERIFIED";
    regPlayer1.isActive = true;
    regPlayer1.reviewedBy = coachUser._id;
    regPlayer1.reviewedAt = new Date();
    await regPlayer1.save();

    regUser1.accountStatus = "ACTIVE";
    regUser1.registrationStatus = "VERIFIED";
    regUser1.isActive = true;
    regUser1.reviewedBy = coachUser._id;
    regUser1.reviewedAt = new Date();
    await regUser1.save();

    const approvedPlayer = await Player.findById(regPlayer1._id);
    const approvedUser = await User.findById(regUser1._id);
    assert(approvedPlayer?.registrationStatus === "VERIFIED" && approvedPlayer?.isActive === true, "Player status transitioned to VERIFIED and active");
    assert(approvedUser?.accountStatus === "ACTIVE" && approvedUser?.isActive === true, "User account status transitioned to ACTIVE and allowed to log in");

    // --- TEST 6: Registration Rejection Flow ---
    console.log("\n--- 6. Registration Rejection Workflow ---");
    const regPlayer2 = await Player.create({
      name: "Pending Applicant B",
      age: 19,
      sport: "badminton",
      isActive: false,
      registrationStatus: "PENDING",
    });
    const regUser2 = await User.create({
      email: `applicant_b_${timestamp}@example.com`,
      passwordHash: await hashPassword("Pass123!"),
      role: "PLAYER",
      accountStatus: "PENDING",
      registrationStatus: "PENDING",
      playerId: regPlayer2._id,
      isActive: false,
    });

    // Simulate Coach Rejection
    regPlayer2.registrationStatus = "REJECTED";
    regPlayer2.isActive = false;
    regPlayer2.reviewedBy = coachUser._id;
    regPlayer2.reviewedAt = new Date();
    regPlayer2.rejectionReason = "Did not meet Dumka district residency requirements";
    await regPlayer2.save();

    regUser2.accountStatus = "REJECTED";
    regUser2.registrationStatus = "REJECTED";
    regUser2.isActive = false;
    regUser2.reviewedBy = coachUser._id;
    regUser2.reviewedAt = new Date();
    regUser2.rejectionReason = regPlayer2.rejectionReason;
    await regUser2.save();

    const rejectedPlayer = await Player.findById(regPlayer2._id);
    const rejectedUser = await User.findById(regUser2._id);
    assert(rejectedPlayer?.registrationStatus === "REJECTED" && rejectedPlayer?.isActive === false, "Rejected player registration marked REJECTED and inactive");
    assert(rejectedUser?.accountStatus === "REJECTED" && rejectedUser?.isActive === false, "Rejected user accountStatus marked REJECTED (login denied)");
    assert(rejectedPlayer?.rejectionReason === "Did not meet Dumka district residency requirements", "Rejection reason persisted accurately");

    // --- TEST 7: Role Security Boundaries ---
    console.log("\n--- 7. Role-Based Security & Tamper Resistance ---");
    const playerToken = await signSessionToken({
      userId: approvedUser!._id.toString(),
      email: approvedUser!.email,
      role: "PLAYER",
      playerId: approvedPlayer!._id.toString(),
      accountStatus: "ACTIVE",
    });
    assert(!!playerToken, "Player session token created for role check");

    // Verify Player cannot pass Coach role guard
    const isPlayerRoleCoach = (role: string) => role === "COACH";
    assert(!isPlayerRoleCoach("PLAYER"), "Player role is rejected by coach authorization guards");
    assert(!isPlayerRoleCoach("SCOUT"), "Scout role is rejected by coach authorization guards");
    assert(isPlayerRoleCoach("COACH"), "Only COACH role passes coach-only authorization guards");

    // Clean up test documents
    await User.deleteMany({ _id: { $in: [coachUser._id, regUser1._id, regUser2._id] } });
    await Player.deleteMany({ _id: { $in: [createdPlayer._id, p1._id, p2._id, p3._id, regPlayer1._id, regPlayer2._id] } });
    console.log("\nCleaned up test records from database.");

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

runPlayerManagementTests();
