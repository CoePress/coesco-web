import dotenv from "dotenv";
import process from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number).default("8080"),
  DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  LOGS_DIR: z.string(),
});

// eslint-disable-next-line node/no-process-env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("❌ Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
export const __dev__ = env.NODE_ENV === "development";
export const __test__ = env.NODE_ENV === "test";
export const __prod__ = env.NODE_ENV === "production";
