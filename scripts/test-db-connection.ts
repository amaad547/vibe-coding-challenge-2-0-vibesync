import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config();

import mongoose from "mongoose";
import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";

async function run() {
  console.log("=== Testing MongoDB Atlas Connection Utility ===");

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log("ℹ️ MONGODB_URI not provided in environment. Testing validation behavior...");
    try {
      await connectToDatabase();
      console.error("❌ Expected error when MONGODB_URI is missing, but succeeded.");
      process.exit(1);
    } catch (err: unknown) {
      const error = err as Error;
      if (error.message.includes("MONGODB_URI is not defined")) {
        console.log("✅ Passed: Correctly throws when MONGODB_URI is missing.");
      } else {
        console.error("❌ Unexpected error message:", error.message);
        process.exit(1);
      }
    }
    console.log("=== MongoDB Connection Utility Test Complete (Without URI) ===");
    return;
  }

  try {
    console.log("1. Attempting connection to MongoDB Atlas...");
    const conn1 = await connectToDatabase();
    console.log("✅ Connection established. ReadyState:", mongoose.connection.readyState);
    console.log("   Host:", mongoose.connection.host);
    console.log("   Database:", mongoose.connection.name);

    console.log("\n2. Testing connection reuse (caching across invocations)...");
    const conn2 = await connectToDatabase();
    if (conn1 === conn2) {
      console.log("✅ Passed: Reused identical cached connection instance.");
    } else {
      console.error("❌ Failed: A new connection was created instead of reusing cached connection.");
      process.exit(1);
    }

    console.log("\n3. Performing real database operation (admin ping)...");
    const pingResult = await mongoose.connection.db?.admin().ping();
    console.log("✅ Real database operation succeeded. Ping response:", pingResult);

    console.log("\n4. Performing real collection query...");
    const collections = await mongoose.connection.db?.listCollections().toArray();
    console.log(
      "✅ Collections fetched successfully:",
      collections?.map((c) => c.name)
    );

    await disconnectDatabase();
    console.log("✅ Successfully disconnected.");
    console.log("\n=== MongoDB Atlas Connection Succeeded ===");
  } catch (error) {
    console.error("❌ MongoDB Atlas Connection test failed:", error);
    process.exit(1);
  }
}

run();
