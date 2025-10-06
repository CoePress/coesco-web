import type { CookieOptions } from "express";

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
  COPY_DATABASE_URL: z.string().url(),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  LOGS_DIR: z.string(),
  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  FANUC_ADAPTER_HOST: z.string(),
  FANUC_ADAPTER_PORT: z.string().transform(Number).default("1435"),

  ODBC_DRIVER: z.string().default("Progress OpenEdge 12.8 Driver"),
  PROSQL_USER: z.string().default("sqltst"),
  PROSQL_PASSWORD: z.string().default("password"),

  STD_HOST: z.string().default("coescoplk"),
  STD_PORT: z.string().default("52551"),
  STD_DB: z.string().default("base"),

  JOB_HOST: z.string().default("coescoplk"),
  JOB_PORT: z.string().default("52552"),
  JOB_DB: z.string().default("job"),

  QUOTE_HOST: z.string().default("coescoplk"),
  QUOTE_PORT: z.string().default("52555"),
  QUOTE_DB: z.string().default("quotesys"),
});

// eslint-disable-next-line node/no-process-env
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data!;
export const __dev__ = env.NODE_ENV === "development";
export const __test__ = env.NODE_ENV === "test";
export const __prod__ = env.NODE_ENV === "production";

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: __prod__,
  sameSite: (__prod__ ? "none" : "lax") as "none" | "lax" | "strict",
  path: "/",
  domain: __prod__ ? "cpec.com" : "localhost",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
