import dotenv from "dotenv";
import path from "path";
import { z } from "zod";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production"]).default("development"),
  PORT: z.string().transform(Number).default("8080"),

  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().transform(Number).default("25"),

  DB_HOST: z.string().default("localhost"),
  DB_PORT: z.string().transform(Number).default("5433"),
  DB_USER: z.string(),
  DB_PASSWORD: z.string(),
  DB_NAME: z.string(),

  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),
  AZURE_SUCCESS_REDIRECT: z.string(),
  AZURE_FAILURE_REDIRECT: z.string(),

  COOKIE_SECRET: z.string(),
  ALLOWED_ORIGIN: z.string(),

  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  REDIS_PASSWORD: z.string(),
  REDIS_DB: z.string().transform(Number).default("0"),

  FANUC_ADAPTER_IP: z.string(),
  FANUC_ADAPTER_PORT: z.string().transform(Number).default("8080"),
});

const env = envSchema.parse(process.env);

const __dev__ = env.NODE_ENV === "development";
const __prod__ = env.NODE_ENV === "production";

export { env, __dev__, __prod__ };
