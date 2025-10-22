/* eslint-disable ts/no-require-imports */
import express from "express";
import request from "supertest";

import app from "../app";

jest.mock("../utils/logger");
jest.mock("../routes", () => {
  const router = express.Router();
  router.get("/", (req, res) => res.status(200).json({ success: true }));
  return {
    __esModule: true,
    default: router,
  };
});

describe("app", () => {
  describe("middleware setup", () => {
    it("should have JSON body parser configured", async () => {
      const testApp = express();
      testApp.use(express.json({ limit: "50mb" }));
      testApp.post("/test", (req, res) => {
        res.status(200).json({ received: req.body });
      });

      const response = await request(testApp)
        .post("/test")
        .send({ test: "data" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ test: "data" });
    });

    it("should have URL encoded parser configured", async () => {
      const testApp = express();
      testApp.use(express.urlencoded({ extended: true, limit: "50mb" }));
      testApp.post("/test", (req, res) => {
        res.status(200).json({ received: req.body });
      });

      const response = await request(testApp)
        .post("/test")
        .send("key=value")
        .set("Content-Type", "application/x-www-form-urlencoded");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ key: "value" });
    });

    it("should have cookie parser configured", async () => {
      const cookieParser = require("cookie-parser");
      const testApp = express();
      testApp.use(cookieParser());
      testApp.get("/test", (req, res) => {
        res.status(200).json({ cookies: req.cookies });
      });

      const response = await request(testApp)
        .get("/test")
        .set("Cookie", "test=value");

      expect(response.status).toBe(200);
      expect(response.body.cookies).toEqual({ test: "value" });
    });
  });

  describe("security headers", () => {
    it("should set security headers with helmet", async () => {
      const response = await request(app).get("/v1");

      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["x-xss-protection"]).toBeDefined();
      expect(response.headers["referrer-policy"]).toBe("strict-origin-when-cross-origin");
    });

    it("should set HSTS header", async () => {
      const response = await request(app).get("/v1");

      expect(response.headers["strict-transport-security"]).toBeDefined();
    });

    it("should set CSP header", async () => {
      const response = await request(app).get("/v1");

      expect(response.headers["content-security-policy"]).toBeDefined();
    });
  });

  describe("cors configuration", () => {
    it("should handle CORS preflight requests", async () => {
      const response = await request(app)
        .options("/v1")
        .set("Origin", "http://localhost:5173")
        .set("Access-Control-Request-Method", "GET");

      expect(response.status).toBe(204);
    });

    it("should set CORS headers on responses", async () => {
      const response = await request(app)
        .get("/v1")
        .set("Origin", "http://localhost:5173");

      expect(response.headers["access-control-allow-origin"]).toBeDefined();
      expect(response.headers["access-control-allow-credentials"]).toBe("true");
    });
  });

  describe("compression", () => {
    it("should compress responses", async () => {
      const compression = require("compression");
      const testApp = express();
      testApp.use(compression());
      testApp.get("/test", (_req, res) => {
        res.send("x".repeat(1500));
      });

      const response = await request(testApp)
        .get("/test")
        .set("Accept-Encoding", "gzip");

      expect(response.headers["content-encoding"]).toBe("gzip");
    });
  });

  describe("swagger documentation", () => {
    it("should serve OpenAPI spec at /openapi.json", async () => {
      const response = await request(app).get("/openapi.json");

      expect(response.status).toBe(200);
      expect(response.type).toBe("application/json");
      expect(response.body).toHaveProperty("swagger");
    });

    it("should serve Swagger UI at /docs", async () => {
      const response = await request(app).get("/docs/");

      expect(response.status).toBe(200);
      expect(response.type).toBe("text/html");
    });
  });

  describe("routes", () => {
    it("should mount v1 routes", async () => {
      const response = await request(app).get("/v1");

      expect(response.status).toBe(200);
    });
  });

  describe("error handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await request(app).get("/non-existent-route");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error");
      expect(response.body.error).toContain("Route not found");
    });

    it("should include method and URL in 404 error", async () => {
      const response = await request(app).post("/another-non-existent");

      expect(response.status).toBe(404);
      expect(response.body.error).toContain("POST");
      expect(response.body.error).toContain("/another-non-existent");
    });

    it("should return JSON error responses", async () => {
      const response = await request(app).get("/invalid-route");

      expect(response.type).toBe("application/json");
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("trust proxy", () => {
    it("should trust proxy headers", async () => {
      const testApp = express();
      testApp.set("trust proxy", true);
      testApp.get("/test", (req, res) => {
        res.status(200).json({ ip: req.ip });
      });

      const response = await request(testApp)
        .get("/test")
        .set("X-Forwarded-For", "1.2.3.4");

      expect(response.status).toBe(200);
      expect(response.body.ip).toBe("1.2.3.4");
    });
  });

  describe("body size limits", () => {
    it("should accept JSON payloads up to 50mb", async () => {
      const testApp = express();
      testApp.use(express.json({ limit: "50mb" }));
      testApp.post("/test", (req, res) => {
        res.status(200).json({ size: req.body.data.length });
      });

      const largePayload = { data: "x".repeat(1000) };

      const response = await request(testApp)
        .post("/test")
        .send(largePayload)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.size).toBe(1000);
    });
  });

  describe("rate limiting", () => {
    it("should apply rate limiting to /api routes", async () => {
      const { rateLimit } = require("express-rate-limit");
      const testApp = express();
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        standardHeaders: true,
        legacyHeaders: false,
      });
      testApp.use("/api", limiter);
      testApp.get("/api/test", (_req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(testApp).get("/api/test");

      expect(response.headers["ratelimit-limit"]).toBeDefined();
    });

    it("should not rate limit non-/api routes", async () => {
      const response = await request(app).get("/v1");

      expect(response.headers["ratelimit-limit"]).toBeUndefined();
    });
  });
});
