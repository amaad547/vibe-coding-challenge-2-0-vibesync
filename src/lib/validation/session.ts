import { z } from "zod";

export const createSessionSchema = z.object({
  date: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}/, "Date must be in YYYY-MM-DD format."),
  sport: z
    .string()
    .trim()
    .min(2, "Sport must be at least 2 characters.")
    .max(40, "Sport must be at most 40 characters.")
    .transform((val) => val.toLowerCase()),
});

export type CreateSessionInput = z.infer<typeof createSessionSchema>;

export const markAttendanceEntrySchema = z.object({
  playerId: z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid player ID format."),
  status: z.enum(["PRESENT", "ABSENT"]),
});

export const updateAttendanceSchema = z.object({
  marks: z.array(markAttendanceEntrySchema).min(1, "At least one attendance mark is required."),
});

export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;
