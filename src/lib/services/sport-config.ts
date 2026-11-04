import { SportConfig, ISportConfig } from "@/models/SportConfig";

export interface SportMetricConfig {
  sport: string;
  scoreMetric: string;
  scoreUnit: string;
}

export const DEFAULT_SPORT_CONFIGS: Record<string, { scoreMetric: string; scoreUnit: string }> = {
  football: {
    scoreMetric: "Goals",
    scoreUnit: "Goals",
  },
  cricket: {
    scoreMetric: "Runs",
    scoreUnit: "Runs",
  },
  basketball: {
    scoreMetric: "Points",
    scoreUnit: "Points",
  },
  athletics: {
    scoreMetric: "Points",
    scoreUnit: "Points",
  },
  badminton: {
    scoreMetric: "Points",
    scoreUnit: "Points",
  },
};

/**
 * Server-side derivation of sport scoring metric and display unit.
 * Never trusts client-supplied metric or unit values.
 */
export async function getSportScoreConfig(
  sport: string
): Promise<{ scoreMetric: string; scoreUnit: string }> {
  const normalized = sport.trim().toLowerCase();

  try {
    const dbConfig = await SportConfig.findOne({
      sport: normalized,
      isActive: true,
    }).lean<ISportConfig | null>();
    if (dbConfig) {
      return {
        scoreMetric: dbConfig.scoreMetric,
        scoreUnit: dbConfig.scoreUnit,
      };
    }
  } catch (error) {
    console.warn(
      `Could not query SportConfig from DB for ${sport}, falling back to defaults`,
      error
    );
  }

  // Fallback to documented academy defaults
  if (DEFAULT_SPORT_CONFIGS[normalized]) {
    return DEFAULT_SPORT_CONFIGS[normalized];
  }

  // Generic fallback for any other sport
  return {
    scoreMetric: "Points",
    scoreUnit: "Points",
  };
}

/**
 * Ensure default sport configs are seeded in the database if empty.
 */
export async function ensureDefaultSportConfigs(): Promise<void> {
  for (const [sport, config] of Object.entries(DEFAULT_SPORT_CONFIGS)) {
    const existing = await SportConfig.findOne({ sport });
    if (!existing) {
      await SportConfig.create({
        sport,
        scoreMetric: config.scoreMetric,
        scoreUnit: config.scoreUnit,
        isActive: true,
      });
    }
  }
}
