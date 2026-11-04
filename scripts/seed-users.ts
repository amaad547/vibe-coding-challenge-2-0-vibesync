import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();
import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";
import { User } from "../src/models/User";
import { hashPassword } from "../src/lib/auth/password";

async function seed() {
  console.log("=== Provisioning Initial Accounts ===");

  const coachEmail = process.env.INITIAL_COACH_EMAIL || "coach@dumkasports.org";
  const coachPassword = process.env.INITIAL_COACH_PASSWORD || "coach@dumka123";
  const scoutEmail = process.env.INITIAL_SCOUT_EMAIL || "scout@dumkasports.org";
  const scoutPassword = process.env.INITIAL_SCOUT_PASSWORD || "scout@sport123";

  try {
    await connectToDatabase();

    // 1. Seed or update Coach
    let coach = await User.findOne({ email: coachEmail.toLowerCase() });
    const coachPasswordHash = await hashPassword(coachPassword);

    if (!coach) {
      coach = await User.create({
        email: coachEmail.toLowerCase(),
        passwordHash: coachPasswordHash,
        role: "COACH",
        accountStatus: "ACTIVE",
        isActive: true,
        registrationStatus: "VERIFIED",
      });
      console.log(`✅ Created initial Coach account: ${coach.email}`);
    } else {
      coach.passwordHash = coachPasswordHash;
      coach.role = "COACH";
      coach.accountStatus = "ACTIVE";
      coach.isActive = true;
      coach.registrationStatus = "VERIFIED";
      await coach.save();
      console.log(`✅ Updated existing Coach account: ${coach.email}`);
    }

    // 2. Seed or update Scout
    let scout = await User.findOne({ email: scoutEmail.toLowerCase() });
    const scoutPasswordHash = await hashPassword(scoutPassword);

    if (!scout) {
      scout = await User.create({
        email: scoutEmail.toLowerCase(),
        passwordHash: scoutPasswordHash,
        role: "SCOUT",
        accountStatus: "ACTIVE",
        isActive: true,
        registrationStatus: "VERIFIED",
      });
      console.log(`✅ Created initial Scout account: ${scout.email}`);
    } else {
      scout.passwordHash = scoutPasswordHash;
      scout.role = "SCOUT";
      scout.accountStatus = "ACTIVE";
      scout.isActive = true;
      scout.registrationStatus = "VERIFIED";
      await scout.save();
      console.log(`✅ Updated existing Scout account: ${scout.email}`);
    }

    console.log("=== Seeding Complete ===");
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  } finally {
    await disconnectDatabase();
  }
}

seed();

