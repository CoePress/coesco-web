import { z } from "zod";
import { config as dotenvConfig } from "dotenv";
import { logger } from "@/utils/logger";

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
  DATABASE_URL: z.string(),

  // Redis
  REDIS_HOST: z.string(),
  REDIS_PORT: z.string().transform(Number).default("6379"),

  // SMTP
  SMTP_HOST: z.string().default(""),
  SMTP_PORT: z.string().transform(Number).default("25"),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default("1d"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  // Cookie
  COOKIE_DOMAIN: z.string().default(""),

  // CORS
  ALLOWED_ORIGINS: z.string().default("*"),

  // Azure
  AZURE_TENANT_ID: z.string(),
  AZURE_CLIENT_ID: z.string(),
  AZURE_CLIENT_SECRET: z.string(),
  AZURE_REDIRECT_URI: z.string(),

  // Misc
  FANUC_ADAPTER_IP: z.string(),
  FANUC_ADAPTER_PORT: z.string().transform(Number).default("8080"),
  COLLECT_MACHINE_DATA: z.string().transform((val) => val === "true"),
});

const env = envSchema.safeParse(process.env);

if (!env.success) {
  logger.error("❌ Invalid environment variables:", env.error.format());

  process.exit(1);
}

export const __dev__ = env.data.NODE_ENV === "development";
export const __prod__ = env.data.NODE_ENV === "production";

export const config = {
  port: env.data.PORT,
  nodeEnv: env.data.NODE_ENV,
  databaseUrl: env.data.DATABASE_URL,
  redisHost: env.data.REDIS_HOST,
  redisPort: env.data.REDIS_PORT,
  smtpHost: env.data.SMTP_HOST,
  smtpPort: env.data.SMTP_PORT,
  jwtSecret: env.data.JWT_SECRET,
  jwtExpiresIn: env.data.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: env.data.JWT_REFRESH_EXPIRES_IN,
  azureTenantId: env.data.AZURE_TENANT_ID,
  azureClientId: env.data.AZURE_CLIENT_ID,
  azureClientSecret: env.data.AZURE_CLIENT_SECRET,
  azureRedirectUri: env.data.AZURE_REDIRECT_URI,
  allowedOrigins: env.data.ALLOWED_ORIGINS,
  cookieOptions: {
    httpOnly: true,
    secure: __prod__,
    sameSite: (__prod__ ? "none" : "lax") as "none" | "lax" | "strict",
    path: "/",
    domain: __prod__ ? ".cpec.com" : "localhost",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  fanucAdapterIp: env.data.FANUC_ADAPTER_IP,
  fanucAdapterPort: env.data.FANUC_ADAPTER_PORT,
  collectMachineData: env.data.COLLECT_MACHINE_DATA,
};
