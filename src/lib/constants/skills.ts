export interface SportSkillOption {
  id: string;
  label: string;
  sport: string;
}

export const SPORT_SKILLS: Record<string, Array<{ id: string; label: string }>> = {
  cricket: [
    { id: "batsman", label: "Batsman" },
    { id: "bowler", label: "Bowler" },
    { id: "all_rounder", label: "All-Rounder" },
    { id: "wicket_keeper", label: "Wicketkeeper / Batsman" },
  ],
  football: [
    { id: "forward", label: "Forward / Striker" },
    { id: "midfielder", label: "Midfielder" },
    { id: "defender", label: "Defender" },
    { id: "goalkeeper", label: "Goalkeeper" },
  ],
  basketball: [
    { id: "point_guard", label: "Point Guard" },
    { id: "shooting_guard", label: "Shooting Guard" },
    { id: "small_forward", label: "Small Forward" },
    { id: "power_forward", label: "Power Forward" },
    { id: "center", label: "Center" },
  ],
  athletics: [
    { id: "sprinter", label: "Sprinter (100m - 400m)" },
    { id: "middle_distance", label: "Middle Distance (800m - 1500m)" },
    { id: "long_distance", label: "Long Distance (5000m+)" },
    { id: "jumper", label: "Jumper (High / Long / Triple)" },
    { id: "thrower", label: "Thrower (Shotput / Javelin)" },
  ],
  badminton: [
    { id: "singles", label: "Singles Specialist" },
    { id: "doubles", label: "Doubles Specialist" },
    { id: "mixed_doubles", label: "Mixed Doubles Specialist" },
    { id: "all_rounder", label: "All-Rounder" },
  ],
};

export function getSkillsForSport(sport: string): Array<{ id: string; label: string }> {
  const norm = sport?.trim().toLowerCase() || "";
  return (
    SPORT_SKILLS[norm] || [
      { id: "all_rounder", label: "All-Rounder" },
      { id: "player", label: "Athlete" },
    ]
  );
}

export function formatSkillLabel(skillIdOrName: string | undefined): string {
  if (!skillIdOrName) return "All-Rounder";
  const clean = skillIdOrName.trim().toLowerCase();
  for (const list of Object.values(SPORT_SKILLS)) {
    const found = list.find((s) => s.id === clean || s.label.toLowerCase() === clean);
    if (found) return found.label;
  }
  return skillIdOrName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export interface ParticipantStats {
  runs?: number;
  wickets?: number;
  overs?: number;
  goals?: number;
  assists?: number;
  points?: number;
  rebounds?: number;
  time?: string;
  distance?: string;
  sets?: number;
}

/**
 * Derives a human-readable summary string matching broadcast and sports website formats
 * (e.g., ESPN Cricinfo, FotMob, NBA.com).
 */
export function formatMatchPerformance(
  sport: string,
  score: number,
  stats?: ParticipantStats,
  role?: string
): string {
  const s = sport?.trim().toLowerCase() || "";

  if (s === "cricket") {
    const runs = stats?.runs ?? score;
    const wickets = stats?.wickets ?? 0;
    if (wickets > 0 && runs > 0) {
      return `${runs} runs, ${wickets} wkts`;
    }
    if (wickets > 0) {
      return `${wickets} wkts (${runs} runs)`;
    }
    return `${runs} runs`;
  }

  if (s === "football") {
    const goals = stats?.goals ?? score;
    const assists = stats?.assists ?? 0;
    if (goals > 0 && assists > 0) {
      return `${goals}G, ${assists}A (${goals} goal${goals === 1 ? "" : "s"}, ${assists} ast)`;
    }
    if (goals > 0) {
      return `${goals} goal${goals === 1 ? "" : "s"}`;
    }
    if (assists > 0) {
      return `${assists} assist${assists === 1 ? "" : "s"}`;
    }
    if (role?.toLowerCase().includes("goalkeeper")) {
      return "0 GA (Clean Sheet)";
    }
    return `${goals} goals`;
  }

  if (s === "basketball") {
    const pts = stats?.points ?? score;
    const reb = stats?.rebounds ?? 0;
    const ast = stats?.assists ?? 0;
    const parts = [`${pts} PTS`];
    if (reb > 0) parts.push(`${reb} REB`);
    if (ast > 0) parts.push(`${ast} AST`);
    return parts.join(", ");
  }

  if (s === "athletics") {
    if (stats?.time) return `⏱ ${stats.time}`;
    if (stats?.distance) return `📏 ${stats.distance}`;
    return `${score} pts`;
  }

  if (s === "badminton") {
    const sets = stats?.sets ?? 0;
    if (sets > 0) return `${sets} sets won (${score} pts)`;
    return `${score} pts`;
  }

  return `${score} points`;
}
