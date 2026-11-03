import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";

export async function GET() {
  let dbStatus = "disconnected";
  let errorMessage: string | undefined;
  let pingOk = false;

  if (process.env.MONGODB_URI) {
    try {
      await connectToDatabase();
      const readyState = mongoose.connection.readyState;
      if (readyState === 1 && mongoose.connection.db) {
        await mongoose.connection.db.admin().ping();
        pingOk = true;
        dbStatus = "connected";
      } else {
        dbStatus = "connecting";
      }
    } catch (err: unknown) {
      console.error("Health check database error:", err);
      dbStatus = "error";
      errorMessage = err instanceof Error ? err.message : String(err);
    }
  } else {
    dbStatus = "not_configured";
    errorMessage = "MONGODB_URI environment variable is not defined.";
  }

  const isHealthy = dbStatus === "connected" && pingOk;

  return NextResponse.json(
    {
      status: isHealthy ? "ok" : "degraded",
      timestamp: new Date().toISOString(),
      database: dbStatus,
      ...(errorMessage ? { error: errorMessage } : {}),
      uptime: process.uptime(),
    },
    { status: isHealthy ? 200 : 503 }
  );
}
