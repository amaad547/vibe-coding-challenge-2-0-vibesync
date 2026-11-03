import { z } from "zod";

export const envSchema = z.object({
  MONGODB_URI: z.string().min(1, "MONGODB_URI is required"),
  AUTH_SECRET: z
    .string()
    .min(32, "AUTH_SECRET must be at least 32 characters long")
    .default("development_fallback_secret_at_least_32_characters_long_for_local_env"),
  APP_BASE_URL: z.string().url().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let validatedEnv: Env | null = null;

export function getEnv(): Env {
  if (validatedEnv) {
    return validatedEnv;
  }

  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error("❌ Environment configuration validation failed:", formatted);
    throw new Error(`Environment validation failed: ${JSON.stringify(formatted)}`);
  }

  validatedEnv = result.data;
  return validatedEnv;
}
