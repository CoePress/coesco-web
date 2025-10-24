/* eslint-disable node/no-process-env */
/* eslint-disable node/prefer-global/process */
import { config } from "dotenv";

config({ path: ".env.test" });

process.env.NODE_ENV = "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "error";

beforeAll(() => {
  jest.spyOn(console, "log").mockImplementation(() => {});
  jest.spyOn(console, "warn").mockImplementation(() => {});
  jest.spyOn(console, "info").mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});

jest.setTimeout(10000);
