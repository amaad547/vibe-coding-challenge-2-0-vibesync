import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const calendarDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const matchParticipantInputSchema = z.object({
  playerId: z.string().regex(objectIdRegex, "Invalid player ID format"),
  score: z
    .number({ invalid_type_error: "Score must be a number" })
    .min(0, "Score cannot be negative")
    .finite("Score must be a finite number"),
});

export const createMatchSchema = z
  .object({
    sessionId: z.string().regex(objectIdRegex, "Invalid session ID format"),
    date: z.string().regex(calendarDateRegex, "Date must be in YYYY-MM-DD calendar format"),
    sport: z
      .string()
      .min(2, "Sport must be at least 2 characters")
      .max(50, "Sport cannot exceed 50 characters")
      .transform((val) => val.trim().toLowerCase()),
    opponent: z
      .string()
      .min(2, "Opponent name must be at least 2 characters")
      .max(80, "Opponent name cannot exceed 80 characters")
      .transform((val) => val.trim()),
    participants: z
      .array(matchParticipantInputSchema)
      .min(1, "At least one participating athlete is required"),
  })
  .refine(
    (data) => {
      const ids = data.participants.map((p) => p.playerId);
      return new Set(ids).size === ids.length;
    },
    {
      message: "Duplicate athletes in match sheet are not permitted",
      path: ["participants"],
    }
  );

export type CreateMatchInput = z.infer<typeof createMatchSchema>;
