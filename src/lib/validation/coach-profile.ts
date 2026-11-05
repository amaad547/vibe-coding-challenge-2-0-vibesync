import { z } from "zod";

export const updateCoachProfileSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(80, "Name must be under 80 characters"),
  phone: z.string().trim().min(5, "Phone number is required").max(30, "Phone number too long"),
  officePhone: z.string().trim().max(30, "Office phone too long").optional().default(""),
  academyAddress: z.string().trim().min(5, "Address must be at least 5 characters").max(200, "Address too long"),
  morningHours: z.string().trim().min(2, "Morning practice hours required").max(50, "Hours text too long"),
  eveningHours: z.string().trim().min(2, "Evening practice hours required").max(50, "Hours text too long"),
  emergencyContact: z.string().trim().max(80, "Emergency note too long").optional().default("On-field Medical & Staff"),
  bio: z.string().trim().max(300, "Bio cannot exceed 300 characters").optional().default(""),
});

export type UpdateCoachProfileInput = z.infer<typeof updateCoachProfileSchema>;

