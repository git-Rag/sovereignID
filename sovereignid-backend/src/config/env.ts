import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  ION_NODE_URL: z.string().url().default("https://ion.msidentity.com"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:5173,http://localhost:5174"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (!cached) {
    const parsed = envSchema.safeParse(process.env);
    if (!parsed.success) {
      const msg = parsed.error.flatten().fieldErrors;
      throw new Error(`Invalid environment: ${JSON.stringify(msg)}`);
    }
    cached = parsed.data;
  }
  return cached;
}

export function getAllowedOriginsList(): string[] {
  return getEnv()
    .ALLOWED_ORIGINS.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
