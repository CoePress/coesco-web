import { z } from "zod";

const envSchema = z.object({
  VITE_NODE_ENV: z.enum(["development", "production"]).default("development"),
  VITE_BASE_URL: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_PUBLIC_POSTHOG_KEY: z.string(),
  VITE_PUBLIC_POSTHOG_HOST: z.string()
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  throw new Error("Invalid environment variables");
}

export const env = parsed.data!;
export const __dev__ = env.VITE_NODE_ENV === "development";
export const __prod__ = env.VITE_NODE_ENV === "production";
