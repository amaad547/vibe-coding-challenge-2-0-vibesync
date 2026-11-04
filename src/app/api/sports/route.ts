import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db/mongodb";
import { requireUser } from "@/lib/auth/session";
import { SportConfig } from "@/models/SportConfig";
import { DEFAULT_SPORT_CONFIGS } from "@/lib/services/sport-config";
import { AppError } from "@/lib/errors/api-error";

export async function GET() {
  try {
    await requireUser();
    await connectToDatabase();

    const dbConfigs = await SportConfig.find({ isActive: true }).lean();
    const configMap = new Map<string, { scoreMetric: string; scoreUnit: string }>();

    // Start with system defaults
    for (const [sport, val] of Object.entries(DEFAULT_SPORT_CONFIGS)) {
      configMap.set(sport, val);
    }

    // Overlay DB configs
    for (const c of dbConfigs) {
      configMap.set(c.sport.toLowerCase(), {
        scoreMetric: c.scoreMetric,
        scoreUnit: c.scoreUnit,
      });
    }

    const sports = Array.from(configMap.entries()).map(([sport, conf]) => ({
      sport,
      scoreMetric: conf.scoreMetric,
      scoreUnit: conf.scoreUnit,
    }));

    return NextResponse.json({
      data: {
        sports,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/sports error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to fetch sports" } },
      { status: 500 }
    );
  }
}
