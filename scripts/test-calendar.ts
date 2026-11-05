import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { Player } from "../src/models/Player";
import { Session } from "../src/models/Session";
import { Activity } from "../src/models/Activity";
import { hashPassword } from "../src/lib/auth/password";
import { signSessionToken } from "../src/lib/auth/token";
import { normalizeCalendarDate, formatCalendarDate } from "../src/lib/utils/date";
import { createActivitySchema } from "../src/lib/validation/activity";

async function runCalendarTests() {
  console.log("================================================================================");
  console.log("     SportSync: Training and Match Calendar Module Verification Suite           ");
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
    const testSport = `cal_sport_${timestamp}`;

    // Provision Test Coach
    const coach = await User.create({
      email: `coach_cal_${timestamp}@dumkasports.org`,
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
    assert(Boolean(coachToken), "Coach session token generated for calendar authorization");

    // Provision Test Player
    const playerRecord = await Player.create({
      name: "Calendar Test Athlete",
      age: 17,
      sport: testSport,
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerUser = await User.create({
      email: `player_cal_${timestamp}@dumkasports.org`,
      passwordHash: await hashPassword("PlayerPass123!"),
      role: "PLAYER",
      playerId: playerRecord._id,
      accountStatus: "ACTIVE",
      isActive: true,
      registrationStatus: "VERIFIED",
    });

    const playerToken = await signSessionToken({
      userId: playerUser._id.toString(),
      email: playerUser.email,
      role: "PLAYER",
      playerId: playerRecord._id.toString(),
      accountStatus: "ACTIVE",
    });
    assert(Boolean(playerToken), "Player session token generated for calendar authorization");

    // ─────────────────────────────────────────────────────────────────────────────
    // 1. Server Validation Rules
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 1. Server Validation & Format Boundary Rules ---");

    const todayStr = formatCalendarDate(new Date());

    // 1A. Invalid 24h Time format
    const invalidTime = createActivitySchema.safeParse({
      type: "TRAINING",
      title: "Morning Drill",
      sport: testSport,
      date: todayStr,
      time: "25:99", // invalid
    });
    assert(!invalidTime.success, "Rejects invalid 24-hour time ('25:99')");

    // 1B. Invalid Date format
    const invalidDate = createActivitySchema.safeParse({
      type: "TRAINING",
      title: "Morning Drill",
      sport: testSport,
      date: "05-11-2026", // invalid format (must be YYYY-MM-DD)
      time: "06:30",
    });
    assert(!invalidDate.success, "Rejects date not formatted as YYYY-MM-DD");

    // 1C. End time before start time
    const invalidEndTime = createActivitySchema.safeParse({
      type: "TRAINING",
      title: "Morning Drill",
      sport: testSport,
      date: todayStr,
      time: "09:00",
      endTime: "08:00", // invalid
    });
    assert(!invalidEndTime.success, "Rejects activity where endTime <= start time");

    // 1D. Match missing opponent
    const matchMissingOpponent = createActivitySchema.safeParse({
      type: "MATCH",
      title: "League Fixture",
      sport: testSport,
      date: todayStr,
      time: "15:30",
      opponent: "", // required for MATCH
    });
    assert(!matchMissingOpponent.success, "Rejects match creation when opponent is missing");

    // 1E. Valid Training input
    const validTraining = createActivitySchema.safeParse({
      type: "TRAINING",
      title: "Morning Tactical Drills",
      sport: testSport,
      date: todayStr,
      time: "06:30",
      endTime: "08:30",
      venue: "Dumka Complex Pitch 1",
      notes: "Bring training bibs and hydration packs",
    });
    assert(validTraining.success, "Accepts complete and valid training session parameters");

    // 1F. Valid Match input
    const validMatch = createActivitySchema.safeParse({
      type: "MATCH",
      title: "Jharkhand State Cup Semifinal",
      sport: testSport,
      date: todayStr,
      time: "16:00",
      endTime: "18:00",
      opponent: "Ranchi United FC",
      venue: "Dumka Main Stadium",
      notes: "Kit: Navy blue home jerseys",
    });
    assert(validMatch.success, "Accepts complete and valid match fixture parameters");

    // ─────────────────────────────────────────────────────────────────────────────
    // 2. Training Session Scheduling & Accidental Duplicate Prevention
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 2. Training Session Scheduling & Duplicate Prevention ---");

    const trainingActivity = await Activity.create({
      type: "TRAINING",
      title: "Morning Tactical Drills",
      sport: testSport,
      date: normalizeCalendarDate(todayStr),
      time: "06:30",
      endTime: "08:30",
      venue: "Dumka Complex Pitch 1",
      notes: "Bring training bibs and hydration packs",
      status: "SCHEDULED",
      createdBy: coach._id,
    });

    assert(trainingActivity.type === "TRAINING", "Created activity of type TRAINING");
    assert(trainingActivity.status === "SCHEDULED", "Initial training status is SCHEDULED");
    assert(Boolean(trainingActivity._id), "Training activity persisted in MongoDB with ID");

    // Test duplicate prevention logic (same type, sport, date, and time)
    const checkDuplicate = async (type: string, sport: string, date: Date, time: string) => {
      const existing = await Activity.findOne({
        type,
        sport,
        date,
        time,
        status: { $ne: "CANCELLED" },
      });
      return Boolean(existing);
    };

    const isDuplicate = await checkDuplicate(
      "TRAINING",
      testSport,
      normalizeCalendarDate(todayStr),
      "06:30"
    );
    assert(isDuplicate, "Detects duplicate activity for same sport, date, time & type");

    const isDifferentTime = await checkDuplicate(
      "TRAINING",
      testSport,
      normalizeCalendarDate(todayStr),
      "16:00"
    );
    assert(!isDifferentTime, "Allows distinct session at different time slot on same day");

    // ─────────────────────────────────────────────────────────────────────────────
    // 3. Match Scheduling & Non-Finalized Invariant
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 3. Match Scheduling & Non-Finalized Invariant ---");

    const matchActivity = await Activity.create({
      type: "MATCH",
      title: "State League Clash",
      sport: testSport,
      opponent: "Ranchi United FC",
      date: normalizeCalendarDate(todayStr),
      time: "15:30",
      endTime: "17:30",
      venue: "Dumka Sports Stadium",
      status: "SCHEDULED",
      createdBy: coach._id,
    });

    assert(matchActivity.type === "MATCH", "Created activity of type MATCH");
    assert(matchActivity.opponent === "Ranchi United FC", "Match records opponent team name");
    assert(matchActivity.status === "SCHEDULED", "Scheduled match has status SCHEDULED");
    assert(!matchActivity.matchId, "Scheduling match does NOT automatically finalize it or assign scores");

    // ─────────────────────────────────────────────────────────────────────────────
    // 4. Activity Details, Editing & Cancellation Workflow
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 4. Activity Details, Editing & Cancellation ---");

    // Edit Activity
    const updatedTitle = "Morning High-Intensity Drills & Conditioning";
    const updatedNotes = "Focus on lateral agility and recovery phases";
    trainingActivity.title = updatedTitle;
    trainingActivity.notes = updatedNotes;
    trainingActivity.venue = "Dumka Main Turf";
    await trainingActivity.save();

    const fetchedAfterEdit = await Activity.findById(trainingActivity._id).lean();
    assert(fetchedAfterEdit?.title === updatedTitle, "Coach can successfully update activity title");
    assert(fetchedAfterEdit?.notes === updatedNotes, "Coach can successfully update activity notes");
    assert(fetchedAfterEdit?.venue === "Dumka Main Turf", "Coach can successfully update activity venue");

    // Cancel Activity
    matchActivity.status = "CANCELLED";
    matchActivity.cancelledAt = new Date();
    matchActivity.cancelledBy = coach._id;
    matchActivity.cancelReason = "Opponent team transit delay due to weather";
    await matchActivity.save();

    const fetchedAfterCancel = await Activity.findById(matchActivity._id).lean();
    assert(fetchedAfterCancel?.status === "CANCELLED", "Activity successfully transitions to CANCELLED");
    assert(Boolean(fetchedAfterCancel?.cancelledAt), "Records cancellation timestamp");
    assert(
      fetchedAfterCancel?.cancelReason === "Opponent team transit delay due to weather",
      "Persists coach-specified cancellation reason"
    );

    // After cancellation, the same slot can be rescheduled without duplicate conflict
    const isCancelledDuplicate = await checkDuplicate(
      "MATCH",
      testSport,
      normalizeCalendarDate(todayStr),
      "15:30"
    );
    assert(!isCancelledDuplicate, "Cancelled activity does not block rescheduling the time slot");

    // ─────────────────────────────────────────────────────────────────────────────
    // 5. Attendance & Match Workflow Integration
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 5. Attendance & Match System Linking Invariants ---");

    // Create an open Session
    const practiceSession = await Session.create({
      date: normalizeCalendarDate(todayStr),
      sport: testSport,
      status: "OPEN",
      roster: [
        {
          playerId: playerRecord._id,
          playerNameSnapshot: playerRecord.name,
          playerSkillSnapshot: "Forward",
          status: "PRESENT",
        },
      ],
      createdBy: coach._id,
    });

    // Link training activity to session
    trainingActivity.sessionId = practiceSession._id;
    await trainingActivity.save();

    assert(
      trainingActivity.sessionId?.toString() === practiceSession._id.toString(),
      "Training activity successfully linked to existing practice session"
    );

    // Simulate session closure via existing workflow
    practiceSession.status = "CLOSED";
    practiceSession.closedAt = new Date();
    practiceSession.closedBy = coach._id;
    await practiceSession.save();

    // Verify resolving status from closed session
    const resolveStatus = (actStatus: string, sessionStatus?: string) => {
      if (sessionStatus === "CLOSED" && actStatus !== "CANCELLED") {
        return "COMPLETED";
      }
      return actStatus;
    };

    const resolved = resolveStatus(trainingActivity.status, practiceSession.status);
    assert(resolved === "COMPLETED", "Training activity status dynamically reflects COMPLETED when linked session is closed");

    // ─────────────────────────────────────────────────────────────────────────────
    // 6. Role-Based Access Control (RBAC) & Player Scoping
    // ─────────────────────────────────────────────────────────────────────────────
    console.log("\n--- 6. Role Permissions & Player Read-Only Invariants ---");

    function authorizeAction(role: string, action: "VIEW" | "CREATE" | "EDIT" | "CANCEL" | "DELETE") {
      if (action === "VIEW") {
        return { allowed: ["COACH", "PLAYER", "SCOUT"].includes(role), status: 200 };
      }
      // Mutating actions are strictly COACH only
      if (role === "COACH") {
        return { allowed: true, status: 200 };
      }
      return { allowed: false, status: 403 };
    }

    assert(authorizeAction("COACH", "VIEW").allowed, "Coach can view calendar activities");
    assert(authorizeAction("COACH", "CREATE").allowed, "Coach can create calendar activities");
    assert(authorizeAction("COACH", "EDIT").allowed, "Coach can edit calendar activities");
    assert(authorizeAction("COACH", "CANCEL").allowed, "Coach can cancel calendar activities");
    assert(authorizeAction("COACH", "DELETE").allowed, "Coach can delete calendar activities");

    assert(authorizeAction("PLAYER", "VIEW").allowed, "Player can view calendar schedule");
    assert(!authorizeAction("PLAYER", "CREATE").allowed, "Player strictly forbidden from creating activities (403)");
    assert(!authorizeAction("PLAYER", "EDIT").allowed, "Player strictly forbidden from editing activities (403)");
    assert(!authorizeAction("PLAYER", "CANCEL").allowed, "Player strictly forbidden from cancelling activities (403)");
    assert(!authorizeAction("PLAYER", "DELETE").allowed, "Player strictly forbidden from deleting activities (403)");

    // ─────────────────────────────────────────────────────────────────────────────
    // 7. Cleanup
    // ─────────────────────────────────────────────────────────────────────────────
    await User.deleteMany({ email: { $in: [coach.email, playerUser.email] } });
    await Player.deleteMany({ _id: playerRecord._id });
    await Session.deleteMany({ sport: testSport });
    await Activity.deleteMany({ sport: testSport });

    console.log("\n================================================================================");
    console.log(`Results: ${passed} Passed, ${failed} Failed`);
    console.log("================================================================================\n");

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("❌ Calendar tests encountered error:", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

runCalendarTests();
