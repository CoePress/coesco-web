import { config } from "dotenv";

export default async function globalSetup() {
  config({ path: ".env.test" });

  process.env.NODE_ENV = "test";

  console.log("🧪 Starting test environment setup...");

  console.log("✅ Test environment ready");
}
