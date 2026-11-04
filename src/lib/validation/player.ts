import { z } from "zod";

export const createPlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters."),
  age: z.coerce
    .number()
    .int("Age must be an integer.")
    .min(5, "Minimum age is 5.")
    .max(100, "Maximum age is 100."),
  sport: z
    .string()
    .trim()
    .min(2, "Sport must be at least 2 characters.")
    .max(40, "Sport must be at most 40 characters.")
    .transform((val) => val.toLowerCase()),
  skill: z.string().trim().max(50).optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please provide a valid email.")
    .optional()
    .or(z.literal("")),
  temporaryPassword: z
    .string()
    .min(6, "Password must be at least 6 characters.")
    .optional()
    .or(z.literal("")),
});

export type CreatePlayerInput = z.infer<typeof createPlayerSchema>;

export const updatePlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters.")
    .optional(),
  age: z.coerce
    .number()
    .int("Age must be an integer.")
    .min(5, "Minimum age is 5.")
    .max(100, "Maximum age is 100.")
    .optional(),
  sport: z
    .string()
    .trim()
    .min(2, "Sport must be at least 2 characters.")
    .max(40, "Sport must be at most 40 characters.")
    .transform((val) => val.toLowerCase())
    .optional(),
  skill: z.string().trim().max(50).optional(),
  isActive: z.boolean().optional(),
});

export type UpdatePlayerInput = z.infer<typeof updatePlayerSchema>;

export const queryPlayersSchema = z.object({
  status: z.enum(["active", "archived", "pending", "all"]).default("all"),
  sport: z.string().trim().toLowerCase().optional(),
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export type QueryPlayersInput = z.infer<typeof queryPlayersSchema>;
