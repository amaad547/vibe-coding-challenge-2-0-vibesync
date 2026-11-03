import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET() {
  let dbStatus = "disconnected";

  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const readyState = mongoose.connection.readyState;
      dbStatus = readyState === 1 ? "connected" : "connecting";
    } catch {
      dbStatus = "error";
    }
  } else {
    dbStatus = "not_configured";
  }

  const isHealthy = dbStatus === "connected" || dbStatus === "not_configured";

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      uptime: process.uptime(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
