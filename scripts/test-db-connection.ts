import "dotenv/config";
import mongoose from "mongoose";
import { connectToDatabase, disconnectDatabase } from "../src/lib/db/mongodb";

async function run() {
  console.log("=== Testing MongoDB Connection Utility ===");

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
    console.log("Attempting initial connection...");
    const conn1 = await connectToDatabase();
    console.log("✅ Initial connection established. ReadyState:", mongoose.connection.readyState);

    console.log("Testing connection reuse...");
    const conn2 = await connectToDatabase();
    if (conn1 === conn2) {
      console.log("✅ Passed: Reused identical cached connection instance.");
    } else {
      console.error("❌ Failed: A new connection was created instead of reusing cached connection.");
      process.exit(1);
    }

    await disconnectDatabase();
    console.log("✅ Successfully disconnected.");
    console.log("=== MongoDB Connection Utility Test Succeeded ===");
  } catch (error) {
    console.error("❌ Connection test failed:", error);
    process.exit(1);
  }
}

run();

