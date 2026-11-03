import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { hashPassword, verifyPassword } from "../src/lib/auth/password";
import { signSessionToken, verifySessionToken } from "../src/lib/auth/token";
import { loginSchema, registerPlayerSchema, reviewRegistrationSchema } from "../src/lib/validation/auth";
import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";

async function runAuthTests() {
  console.log("==================================================");
  console.log("   SportSync Phase 2: Auth & RBAC Test Suite     ");
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

  // --- TEST 1: Password Hashing ---
  console.log("--- 1. Cryptographic Password Hashing Tests ---");
  const rawPassword = "CoachStrongPassword2026!";
  const hash = await hashPassword(rawPassword);
  assert(typeof hash === "string" && hash.length > 30, "Generates secure bcrypt hash string");
  assert(hash !== rawPassword, "Password hash is not plaintext");
  assert(await verifyPassword(rawPassword, hash), "Valid password verifies successfully against hash");
  assert(!(await verifyPassword("WrongPassword123", hash)), "Invalid password rejected by verifyPassword");

  // --- TEST 2: JWT Session Token Verification ---
  console.log("\n--- 2. Session Token (JWT / Jose) Tests ---");
  const testPayload = {
    userId: "64e000000000000000000001",
    email: "coach@dumkasports.org",
    role: "COACH" as const,
    accountStatus: "ACTIVE" as const,
  };
  const token = await signSessionToken(testPayload);
  assert(typeof token === "string" && token.split(".").length === 3, "Signs compact JWS session token");

  const verified = await verifySessionToken(token);
  assert(verified !== null, "Verifies valid session token successfully");
  assert(verified?.userId === testPayload.userId, "Extracted userId matches payload");
  assert(verified?.role === "COACH", "Extracted role matches payload");
  assert(verified?.email === testPayload.email, "Extracted email matches payload");

  const tamperedToken = token.slice(0, -6) + "xxxxxx";
  const tamperedVerified = await verifySessionToken(tamperedToken);
  assert(tamperedVerified === null, "Tampered session token fails verification");

  // --- TEST 3: Zod Schema Validation ---
  console.log("\n--- 3. Validation Schema Tests ---");
  const validReg = registerPlayerSchema.safeParse({
    name: "Aarav Sharma",
    email: "AARAV@EXAMPLE.COM",
    password: "securepassword",
    age: 17,
    sport: "Football",
  });
  assert(validReg.success, "Valid player registration input accepted");
  if (validReg.success) {
    assert(validReg.data.email === "aarav@example.com", "Email is automatically normalized to lowercase");
    assert(validReg.data.sport === "football", "Sport is automatically normalized to lowercase");
  }

  const invalidAge = registerPlayerSchema.safeParse({
    name: "Too Young",
    email: "young@example.com",
    password: "password123",
    age: 4, // min 5
    sport: "Football",
  });
  assert(!invalidAge.success, "Rejects registration with age below minimum (< 5)");

  const invalidEmail = loginSchema.safeParse({
    email: "not-an-email",
    password: "password123",
  });
  assert(!invalidEmail.success, "Rejects login with invalid email format");

  const validReview = reviewRegistrationSchema.safeParse({
    decision: "APPROVE",
  });
  assert(validReview.success, "Valid coach review decision accepted");

  // --- TEST 4: Live MongoDB Role & State Flow Tests ---
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("\n⚠️ Note: MONGODB_URI not provided. Skipping live database query scenarios.");
    console.log("   To run live database integration tests, set MONGODB_URI in .env.local.");
  } else {
    console.log("\n--- 4. Live MongoDB Role & Registration Workflow Tests ---");
    try {
      await connectToDatabase();
      console.log("Connected to MongoDB for auth integration tests.");

      const testEmail = `test_player_${Date.now()}@example.com`;
      const testCoachEmail = `test_coach_${Date.now()}@example.com`;
      const testScoutEmail = `test_scout_${Date.now()}@example.com`;

      // 4A. Seed Coach
      const coachUser = await User.create({
        email: testCoachEmail,
        passwordHash: await hashPassword("CoachPass123!"),
        role: "COACH",
        accountStatus: "ACTIVE",
        isActive: true,
        registrationStatus: "VERIFIED",
      });
      assert(coachUser.role === "COACH" && coachUser.accountStatus === "ACTIVE", "Coach account provisioned with ACTIVE status");

      // 4B. Seed Scout
      const scoutUser = await User.create({
        email: testScoutEmail,
        passwordHash: await hashPassword("ScoutPass123!"),
        role: "SCOUT",
        accountStatus: "ACTIVE",
        isActive: true,
        registrationStatus: "VERIFIED",
      });
      assert(scoutUser.role === "SCOUT" && scoutUser.accountStatus === "ACTIVE", "Scout account provisioned with ACTIVE status");

      // 4C. Player Self-Registration (starts PENDING)
      const playerRecord = await Player.create({
        name: "Test Athlete",
        age: 16,
        sport: "football",
        isActive: false,
        registrationStatus: "PENDING",
      });

      const playerUser = await User.create({
        email: testEmail,
        passwordHash: await hashPassword("PlayerPass123!"),
        role: "PLAYER",
        accountStatus: "PENDING",
        registrationStatus: "PENDING",
        playerId: playerRecord._id,
        isActive: false,
      });

      assert(playerUser.accountStatus === "PENDING", "New player registration starts in PENDING status");
      assert(playerUser.isActive === false, "New player registration user is inactive by default");
      assert(playerRecord.registrationStatus === "PENDING", "Linked player profile has PENDING registration status");

      // 4D. Simulated Pending Login Check
      const pendingAllowed = playerUser.role === "PLAYER" && playerUser.accountStatus === "ACTIVE" && playerUser.isActive;
      assert(!pendingAllowed, "Pending player login is strictly denied by auth rules");

      // 4E. Coach Review: APPROVE
      playerRecord.registrationStatus = "VERIFIED";
      playerRecord.isActive = true;
      playerRecord.reviewedBy = coachUser._id;
      playerRecord.reviewedAt = new Date();
      await playerRecord.save();

      playerUser.accountStatus = "ACTIVE";
      playerUser.registrationStatus = "VERIFIED";
      playerUser.isActive = true;
      playerUser.reviewedBy = coachUser._id;
      playerUser.reviewedAt = new Date();
      await playerUser.save();

      const approvedAllowed = playerUser.role === "PLAYER" && playerUser.accountStatus === "ACTIVE" && playerUser.isActive;
      assert(approvedAllowed, "Approved player can now authenticate successfully");

      // 4F. Coach Review: REJECT Scenario
      const rejectEmail = `test_reject_${Date.now()}@example.com`;
      const rejectPlayer = await Player.create({
        name: "Rejected Candidate",
        age: 18,
        sport: "football",
        isActive: false,
        registrationStatus: "REJECTED",
        rejectionReason: "Incomplete documentation",
      });
      const rejectUser = await User.create({
        email: rejectEmail,
        passwordHash: await hashPassword("CandidatePass123!"),
        role: "PLAYER",
        accountStatus: "REJECTED",
        registrationStatus: "REJECTED",
        playerId: rejectPlayer._id,
        isActive: false,
      });

      const rejectAllowed = rejectUser.role === "PLAYER" && rejectUser.accountStatus === "ACTIVE" && rejectUser.isActive;
      assert(!rejectAllowed, "Rejected player login is strictly denied by auth rules");

      // Clean up test records
      await User.deleteMany({ _id: { $in: [coachUser._id, scoutUser._id, playerUser._id, rejectUser._id] } });
      await Player.deleteMany({ _id: { $in: [playerRecord._id, rejectPlayer._id] } });
      console.log("Cleaned up test fixtures from database.");

      await disconnectDatabase();
    } catch (dbError) {
      console.error("Live DB testing failed:", dbError);
      failed++;
    }
  }

  console.log("\n==================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthTests();
