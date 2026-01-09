/* eslint-disable node/no-process-env */
import dotenv from "dotenv";
import process from "node:process";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().min(1000),
  ENV: z
    .union([
      z.literal("development"),
      z.literal("testing"),
      z.literal("production"),
    ])
    .default("development"),
  LOG_LEVEL: z.string().default("info"),
  DATABASE_URL: z.string(),
  ACCESS_TOKEN_SECRET: z.string(),

  ODBC_DRIVER: z.string(),
  PROSQL_USER: z.string(),
  PROSQL_PASSWORD: z.string(),

  STD_HOST: z.string(),
  STD_PORT: z.coerce.number(),
  STD_DB: z.string(),

  JOB_HOST: z.string(),
  JOB_PORT: z.coerce.number(),
  JOB_DB: z.string(),

  QUOTE_HOST: z.string(),
  QUOTE_PORT: z.coerce.number(),
  QUOTE_DB: z.string(),

  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),
  GRAPH_ENCRYPTION_KEY: z.string().min(32),

  CORS_ORIGINS: z.string().optional(),

  BACKUP_DIR: z.string().optional(),
  BACKUP_RETENTION_DAYS: z.coerce.number().default(14),
});

const env = envSchema.parse(process.env);

export const __dev__ = env.ENV === "development";
export const __test__ = env.ENV === "testing";
export const __prod__ = env.ENV === "production";

export default env;
