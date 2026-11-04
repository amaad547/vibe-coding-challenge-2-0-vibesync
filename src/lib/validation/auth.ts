import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please provide a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const registerPlayerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name must be at most 80 characters."),
  email: z.string().trim().toLowerCase().email("Please provide a valid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  age: z.coerce
    .number()
    .int("Age must be a whole number.")
    .min(5, "Minimum age is 5.")
    .max(100, "Maximum age is 100."),
  sport: z
    .string()
    .trim()
    .min(2, "Sport must be at least 2 characters.")
    .max(40, "Sport must be at most 40 characters.")
    .transform((val) => val.toLowerCase()),
  skill: z
    .string()
    .trim()
    .max(50, "Skill cannot exceed 50 characters.")
    .optional(),
});

export type RegisterPlayerInput = z.infer<typeof registerPlayerSchema>;

export const reviewRegistrationSchema = z.object({
  decision: z.enum(["APPROVE", "REJECT"]),
  rejectionReason: z.string().trim().max(200).optional(),
});

export type ReviewRegistrationInput = z.infer<typeof reviewRegistrationSchema>;
