import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/session";
import { getAcademyReadiness } from "@/lib/services/readiness";
import { AppError } from "@/lib/errors/api-error";

export async function GET(request: NextRequest) {
  try {
    await requireRole("COACH");

    const { searchParams } = new URL(request.url);
    const sport = searchParams.get("sport")?.trim().toLowerCase();

    const readinessList = await getAcademyReadiness({
      sport,
      onlyActive: true,
      onlyVerified: true,
    });

    const readyCount = readinessList.filter((p) => p.isReady).length;
    const notReadyCount = readinessList.length - readyCount;

    return NextResponse.json({
      data: {
        totalEvaluated: readinessList.length,
        readyCount,
        notReadyCount,
        players: readinessList,
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.statusCode }
      );
    }
    console.error("GET /api/readiness error:", error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "Failed to evaluate player readiness" } },
      { status: 500 }
    );
  }
}
