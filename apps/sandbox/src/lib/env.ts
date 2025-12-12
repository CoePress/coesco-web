import { z } from 'zod'

import dotenv from "dotenv";
import process from "node:process";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().min(1000),
  ENV: z
    .union([
      z.literal('development'),
      z.literal('testing'),
      z.literal('production'),
    ])
    .default('development'),
  LOG_LEVEL: z.string().default("info")
});

const env = envSchema.parse(process.env);

export const __dev__ = env.ENV === "development";
export const __test__ = env.ENV === "testing";
export const __prod__ = env.ENV === "production";

export default env;