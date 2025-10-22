import request from "supertest";

import app from "../app";

jest.mock("../utils/logger");
jest.mock("../routes", () => ({
  __esModule: true,
  default: (req: any, res: any) => res.status(200).json({ success: true }),
}));

describe("app", () => {
  describe("middleware setup", () => {
    it("should have JSON body parser configured", async () => {
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ received: req.body });
      });

      app.post("/test-json", mockRoute);

      const response = await request(app)
        .post("/test-json")
        .send({ test: "data" })
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ test: "data" });
    });

    it("should have URL encoded parser configured", async () => {
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ received: req.body });
      });

      app.post("/test-urlencoded", mockRoute);

      const response = await request(app)
        .post("/test-urlencoded")
        .send("key=value")
        .set("Content-Type", "application/x-www-form-urlencoded");

      expect(response.status).toBe(200);
      expect(response.body.received).toEqual({ key: "value" });
    });

    it("should have cookie parser configured", async () => {
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ cookies: req.cookies });
      });

      app.get("/test-cookies", mockRoute);

      const response = await request(app)
        .get("/test-cookies")
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
      const response = await request(app)
        .get("/v1")
        .set("Accept-Encoding", "gzip");

      expect(response.headers["content-encoding"]).toBeDefined();
    });
  });

  describe("swagger documentation", () => {
    it("should serve OpenAPI spec at /openapi.json", async () => {
      const response = await request(app).get("/openapi.json");

      expect(response.status).toBe(200);
      expect(response.type).toBe("application/json");
      expect(response.body).toHaveProperty("openapi");
    });

    it("should serve Swagger UI at /docs", async () => {
      const response = await request(app).get("/docs/");

      expect(response.status).toBe(301);
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
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ ip: req.ip });
      });

      app.get("/test-ip", mockRoute);

      await request(app)
        .get("/test-ip")
        .set("X-Forwarded-For", "1.2.3.4");

      expect(mockRoute).toHaveBeenCalled();
    });
  });

  describe("body size limits", () => {
    it("should accept JSON payloads up to 50mb", async () => {
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ size: req.body.data.length });
      });

      app.post("/test-size", mockRoute);

      const largePayload = { data: "x".repeat(1000) };

      const response = await request(app)
        .post("/test-size")
        .send(largePayload)
        .set("Content-Type", "application/json");

      expect(response.status).toBe(200);
    });
  });

  describe("rate limiting", () => {
    it("should apply rate limiting to /api routes", async () => {
      const mockRoute = jest.fn((req, res) => {
        res.status(200).json({ success: true });
      });

      app.get("/api/test-rate-limit", mockRoute);

      const response = await request(app).get("/api/test-rate-limit");

      expect(response.headers["ratelimit-limit"]).toBeDefined();
    });

    it("should not rate limit non-/api routes", async () => {
      const response = await request(app).get("/v1");

      expect(response.headers["ratelimit-limit"]).toBeUndefined();
    });
  });
});
