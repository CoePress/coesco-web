import type { NextFunction, Request, Response } from "express";

import {
  preventDirectoryTraversal,
  preventStaticFileServing,
  securityHeaders,
} from "../security.middleware";

describe("security.middleware", () => {
  let mockResponse: Response;
  let mockNext: NextFunction;

  const createMockRequest = (path: string): Request => ({
    path,
  } as Request);

  beforeEach(() => {
    mockResponse = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    } as unknown as Response;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("securityHeaders", () => {
    it("should set all security headers", () => {
      const mockRequest = createMockRequest("/api/users");
      securityHeaders(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains; preload",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "X-Content-Type-Options",
        "nosniff",
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-Frame-Options", "DENY");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("X-XSS-Protection", "1; mode=block");
      expect(mockResponse.setHeader).toHaveBeenCalledWith("Referrer-Policy", "no-referrer");
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        "Feature-Policy",
        "camera 'none'; microphone 'none'; geolocation 'none'",
      );
    });

    it("should call next after setting headers", () => {
      const mockRequest = createMockRequest("/api/users");
      securityHeaders(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockNext).toHaveBeenCalledWith();
    });

    it("should set exactly 6 headers", () => {
      const mockRequest = createMockRequest("/api/users");
      securityHeaders(mockRequest, mockResponse, mockNext);

      expect(mockResponse.setHeader).toHaveBeenCalledTimes(6);
    });
  });

  describe("preventDirectoryTraversal", () => {
    it("should allow normal paths", () => {
      const mockRequest = createMockRequest("/api/users/123");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should block paths with ..", () => {
      const mockRequest = createMockRequest("/api/../etc/passwd");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should block paths with ~ (tilde)", () => {
      const mockRequest = createMockRequest("/api/~user/files");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should block paths with backslash", () => {
      const mockRequest = createMockRequest("/api\\windows\\system32");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should decode URL-encoded paths before checking", () => {
      const mockRequest = createMockRequest("/api/%2E%2E/etc/passwd");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should handle encoded tilde", () => {
      const mockRequest = createMockRequest("/api/%7Euser/files");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid path",
        message: "Directory traversal attempts are not allowed",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should allow paths with dots that are not ..", () => {
      const mockRequest = createMockRequest("/api/file.txt");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow paths with single dot", () => {
      const mockRequest = createMockRequest("/api/./current");

      preventDirectoryTraversal(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });

  describe("preventStaticFileServing", () => {
    it("should allow normal API paths", () => {
      const mockRequest = createMockRequest("/api/users");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should block .html files", () => {
      const mockRequest = createMockRequest("/index.html");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it("should block .htm files", () => {
      const mockRequest = createMockRequest("/page.htm");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should block .js files", () => {
      const mockRequest = createMockRequest("/app.js");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should block .css files", () => {
      const mockRequest = createMockRequest("/styles.css");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should block .map files", () => {
      const mockRequest = createMockRequest("/app.js.map");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should block .txt files", () => {
      const mockRequest = createMockRequest("/robots.txt");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should block .xml files", () => {
      const mockRequest = createMockRequest("/sitemap.xml");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should allow /docs path", () => {
      const mockRequest = createMockRequest("/docs/index.html");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow /openapi.json", () => {
      const mockRequest = createMockRequest("/openapi.json");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should be case-insensitive for file extensions", () => {
      const mockRequest = createMockRequest("/INDEX.HTML");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Forbidden",
        message: "Static file serving is disabled",
      });
    });

    it("should allow paths that do not end with static extensions", () => {
      const mockRequest = createMockRequest("/api/javascript-tutorial");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it("should allow /docs with nested paths", () => {
      const mockRequest = createMockRequest("/docs/api/endpoints.html");

      preventStaticFileServing(mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledTimes(1);
      expect(mockResponse.status).not.toHaveBeenCalled();
    });
  });
});
