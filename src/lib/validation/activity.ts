import { z } from "zod";

const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createActivitySchema = z
  .object({
    type: z.enum(["TRAINING", "MATCH"], {
      required_error: "Activity type is required (TRAINING or MATCH)",
    }),
    title: z
      .string()
      .trim()
      .min(2, "Title must be at least 2 characters")
      .max(100, "Title cannot exceed 100 characters"),
    sport: z
      .string()
      .trim()
      .min(2, "Sport is required")
      .max(50, "Sport text too long")
      .transform((val) => val.toLowerCase()),
    date: z.string().regex(dateRegex, "Date must be in YYYY-MM-DD format"),
    time: z.string().regex(timeRegex, "Time must be in 24-hour HH:mm format (e.g. 06:30 or 15:45)"),
    endTime: z
      .string()
      .regex(timeRegex, "End time must be in 24-hour HH:mm format")
      .optional()
      .or(z.literal("")),
    venue: z.string().trim().max(120, "Venue cannot exceed 120 characters").optional().default(""),
    opponent: z.string().trim().max(80, "Opponent cannot exceed 80 characters").optional().default(""),
    notes: z.string().trim().max(500, "Notes cannot exceed 500 characters").optional().default(""),
    sessionId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "MATCH") {
        return Boolean(data.opponent && data.opponent.trim().length >= 2);
      }
      return true;
    },
    {
      message: "Opponent name is required for match events (at least 2 characters)",
      path: ["opponent"],
    }
  )
  .refine(
    (data) => {
      if (data.endTime && data.endTime.trim().length > 0) {
        return data.endTime > data.time;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type CreateActivityInput = z.infer<typeof createActivitySchema>;

export const updateActivitySchema = z
  .object({
    title: z.string().trim().min(2).max(100).optional(),
    sport: z
      .string()
      .trim()
      .min(2)
      .max(50)
      .transform((val) => val.toLowerCase())
      .optional(),
    date: z.string().regex(dateRegex).optional(),
    time: z.string().regex(timeRegex).optional(),
    endTime: z.string().regex(timeRegex).optional().or(z.literal("")),
    venue: z.string().trim().max(120).optional(),
    opponent: z.string().trim().max(80).optional(),
    notes: z.string().trim().max(500).optional(),
    status: z.enum(["SCHEDULED", "COMPLETED", "CANCELLED"]).optional(),
    sessionId: z.string().optional(),
    matchId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.time && data.endTime && data.endTime.trim().length > 0) {
        return data.endTime > data.time;
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["endTime"],
    }
  );

export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;

export const cancelActivitySchema = z.object({
  reason: z.string().trim().max(200, "Cancellation reason cannot exceed 200 characters").optional().default(""),
});

export type CancelActivityInput = z.infer<typeof cancelActivitySchema>;

