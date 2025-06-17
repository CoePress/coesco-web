import { z } from "zod";

const envSchema = z.object({
  VITE_NODE_ENV: z.enum(["development", "production"]).default("development"),
  VITE_BASE_URL: z.string().url(),
  VITE_API_URL: z.string().url(),
  VITE_PYTHON_API_URL: z.string().url().default("http://127.0.0.1:5000"),
});

const env = envSchema.safeParse(import.meta.env);

if (!env.success) {
  console.error("Invalid environment variables:", env.error.format());
  throw new Error("Invalid environment variables");
}

export const __dev__ = env.data.VITE_NODE_ENV === "development";
export const __prod__ = env.data.VITE_NODE_ENV === "production";

export default env.data;
