/* eslint-disable node/no-process-env */
import type { CookieOptions } from "express";

import dotenv from "dotenv";
import process from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.string().regex(/^\d+$/).transform(Number),
  DATABASE_URL: z.string().url(),
  DATABASE_CONNECTION_LIMIT: z.string().transform(Number).default("10"),
  DATABASE_POOL_TIMEOUT: z.string().transform(Number).default("20"),
  DATABASE_CONNECTION_TIMEOUT: z.string().transform(Number).default("10"),
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number),
  REDIS_URL: z.string(),
  LOGS_DIR: z.string(),
  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),
  TEAMS_AZURE_TENANT_ID: z.string(),
  TEAMS_AZURE_CLIENT_ID: z.string(),
  TEAMS_AZURE_CLIENT_SECRET: z.string(),
  TEAMS_AZURE_REDIRECT_URI: z.string(),
  TEAMS_WEBHOOK_URL: z.string().url(),
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),
  FANUC_ADAPTER_HOST: z.string(),
  FANUC_ADAPTER_PORT: z.string().transform(Number),

  CLIENT_URL: z.string().url(),

  SMTP_HOST: z.string(),
  SMTP_PORT: z.string().transform(Number),

  OPENAI_API_KEY: z.string(),
  ANTHROPIC_API_KEY: z.string(),

  JIRA_API_TOKEN: z.string(),
  JIRA_EMAIL: z.string(),
  JIRA_DOMAIN: z.string(),
  JIRA_PROJECT_KEY: z.string(),

  ODBC_DRIVER: z.string(),
  PROSQL_USER: z.string(),
  PROSQL_PASSWORD: z.string(),

  STD_HOST: z.string(),
  STD_PORT: z.string(),
  STD_DB: z.string(),

  JOB_HOST: z.string(),
  JOB_PORT: z.string(),
  JOB_DB: z.string(),

  QUOTE_HOST: z.string(),
  QUOTE_PORT: z.string(),
  QUOTE_DB: z.string(),

  API_KEYS: z.string().min(1).describe("Comma-separated list of valid API keys for system access"),

  TOKEN_ENCRYPTION_KEY: z.string().length(64),

  BACKUP_DIR: z.string().optional(),
  BACKUP_RETENTION_DAYS: z.string().transform(Number).optional(),
  BACKUP_ENABLED: z.string().transform(val => val === "true").default("true"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  process.exit(1);
}

export const env = parsed.data!;
export const __dev__ = env.NODE_ENV === "development";
export const __test__ = env.NODE_ENV === "test";
export const __prod__ = env.NODE_ENV === "production";

export const API_KEYS = new Set(
  env.API_KEYS.split(",").map(key => key.trim()).filter(key => key.length > 0),
);

export const cookieOptions: CookieOptions = {
  httpOnly: true,
  secure: __prod__,
  sameSite: __dev__ ? false : "none" as any,
  path: "/",
  domain: __prod__ ? "cpec.com" : undefined,
  maxAge: 7 * 24 * 60 * 60 * 1000,
};
