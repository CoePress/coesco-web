import { z } from "zod";
import { config as dotenvConfig } from "dotenv";

dotenvConfig({ path: ".env" });

const envSchema = z.object({
  // Environment
  NODE_ENV: z
    .enum(["development", "test", "production"])
    .default("development"),
  PORT: z
    .string()
    .transform((val) => parseInt(val, 10))
    .default("5000"),

  // Database
  DATABASE_HOST: z.string(),
  DATABASE_PORT: z.string().transform((val) => parseInt(val, 10)),
  DATABASE_USER: z.string(),
  DATABASE_PASSWORD: z.string(),
  DATABASE_NAME: z.string(),

  // Azure
  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),
  AZURE_SUCCESS_REDIRECT: z.string(),
  AZURE_FAILURE_REDIRECT: z.string(),

  // SMTP
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().transform(Number).default("25"),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Cookie
  COOKIE_DOMAIN: z.string().default(""),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default("6379"),
  REDIS_PASSWORD: z.string(),
  REDIS_DB: z.string().transform(Number).default("0"),

  // CORS
  ALLOWED_ORIGINS: z.string().default("*"),

  // Misc
  FANUC_ADAPTER_IP: z.string(),
  FANUC_ADAPTER_PORT: z.string().transform(Number).default("8080"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  console.error(
    "❌ Invalid environment variables:",
    JSON.stringify(env.error.format(), null, 2)
  );
  process.exit(1);
}

export const __dev__ = env.data.NODE_ENV === "development";
export const __prod__ = env.data.NODE_ENV === "production";

export const config = {
  port: env.data.PORT,
  nodeEnv: env.data.NODE_ENV,
  database: {
    host: env.data.DATABASE_HOST,
    port: env.data.DATABASE_PORT,
    user: env.data.DATABASE_USER,
    password: env.data.DATABASE_PASSWORD,
    name: env.data.DATABASE_NAME,
  },
  azure: {
    tenantId: env.data.AZURE_TENANT_ID,
    clientId: env.data.AZURE_CLIENT_ID,
    clientSecret: env.data.AZURE_CLIENT_SECRET,
    redirectUri: env.data.AZURE_REDIRECT_URI,
    successRedirect: env.data.AZURE_SUCCESS_REDIRECT,
    failureRedirect: env.data.AZURE_FAILURE_REDIRECT,
  },
  smtp: {
    host: env.data.SMTP_HOST,
    port: env.data.SMTP_PORT,
  },
  jwt: {
    secret: env.data.JWT_SECRET,
    expiresIn: env.data.JWT_EXPIRES_IN,
    refreshExpiresIn: env.data.JWT_REFRESH_EXPIRES_IN,
  },
  redis: {
    host: env.data.REDIS_HOST,
    port: env.data.REDIS_PORT,
    password: env.data.REDIS_PASSWORD,
    db: env.data.REDIS_DB,
  },
  cors: {
    allowedOrigins: env.data.ALLOWED_ORIGINS.split(","),
  },
  cookieOptions: {
    httpOnly: true,
    secure: __prod__,
    sameSite: "lax" as const,
    path: "/",
    domain: env.data.COOKIE_DOMAIN || undefined,
  },
  fanucAdapter: {
    ip: env.data.FANUC_ADAPTER_IP,
    port: env.data.FANUC_ADAPTER_PORT,
  },
};
