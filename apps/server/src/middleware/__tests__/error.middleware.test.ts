import type { NextFunction, Request, Response } from "express";

import { ZodError } from "zod";

import { env } from "@/config/env";

import {
  AppError,
  BadRequestError,
  errorHandler,
  ForbiddenError,
  InternalServerError,
  NotFoundError,
  UnauthorizedError,
} from "../error.middleware";

describe("error.middleware", () => {
  let mockRequest: Request;
  let mockResponse: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {} as Request;
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      type: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      headersSent: false,
    } as unknown as Response;
    mockNext = jest.fn();
    jest.clearAllMocks();
  });

  describe("error Classes", () => {
    describe("appError", () => {
      it("should create an error with custom status", () => {
        const error = new AppError("Test error", 418);
        expect(error.message).toBe("Test error");
        expect(error.status).toBe(418);
        expect(error).toBeInstanceOf(Error);
      });
    });

    describe("notFoundError", () => {
      it("should create a 404 error", () => {
        const error = new NotFoundError("Resource not found");
        expect(error.message).toBe("Resource not found");
        expect(error.status).toBe(404);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    describe("badRequestError", () => {
      it("should create a 400 error", () => {
        const error = new BadRequestError("Invalid input");
        expect(error.message).toBe("Invalid input");
        expect(error.status).toBe(400);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    describe("unauthorizedError", () => {
      it("should create a 401 error", () => {
        const error = new UnauthorizedError("Not authenticated");
        expect(error.message).toBe("Not authenticated");
        expect(error.status).toBe(401);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    describe("forbiddenError", () => {
      it("should create a 403 error", () => {
        const error = new ForbiddenError("Access denied");
        expect(error.message).toBe("Access denied");
        expect(error.status).toBe(403);
        expect(error).toBeInstanceOf(AppError);
      });
    });

    describe("internalServerError", () => {
      it("should create a 500 error", () => {
        const error = new InternalServerError("Server error");
        expect(error.message).toBe("Server error");
        expect(error.status).toBe(500);
        expect(error).toBeInstanceOf(AppError);
      });
    });
  });

  describe("errorHandler", () => {
    it("should return early if headers already sent", () => {
      mockResponse.headersSent = true;
      const error = new Error("Test error");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockNext).toHaveBeenCalledWith(error);
      expect(mockResponse.status).not.toHaveBeenCalled();
      expect(mockResponse.json).not.toHaveBeenCalled();
    });

    it("should handle ZodError with 400 status", () => {
      const zodError = new ZodError([
        {
          code: "invalid_type",
          expected: "string",
          received: "number",
          path: ["email"],
          message: "Expected string, received number",
        },
        {
          code: "invalid_type",
          expected: "string",
          received: "undefined",
          path: ["user", "name"],
          message: "Required field",
        },
      ]);

      errorHandler(zodError, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.type).toHaveBeenCalledWith("application/json");
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: [
          { field: "email", message: "Expected string, received number" },
          { field: "user.name", message: "Required field" },
        ],
      });
    });

    it("should handle AppError with custom status", () => {
      const error = new AppError("Custom error", 422);

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.type).toHaveBeenCalledWith("application/json");
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Custom error" });
    });

    it("should handle NotFoundError with 404 status", () => {
      const error = new NotFoundError("User not found");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "User not found" });
    });

    it("should handle BadRequestError with 400 status", () => {
      const error = new BadRequestError("Invalid data");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Invalid data" });
    });

    it("should handle UnauthorizedError with 401 status", () => {
      const error = new UnauthorizedError("Not authenticated");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Not authenticated" });
    });

    it("should handle ForbiddenError with 403 status", () => {
      const error = new ForbiddenError("Access denied");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Access denied" });
    });

    it("should handle InternalServerError with 500 status", () => {
      const error = new InternalServerError("Server crashed");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Server crashed" });
    });

    it("should handle generic Error with 500 status", () => {
      const error = new Error("Something went wrong");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Something went wrong" });
    });

    it("should handle unknown error type with default message", () => {
      const error = "string error";

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });

    it("should handle Error with empty message", () => {
      // eslint-disable-next-line unicorn/error-message
      const error = new Error("");

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: "Internal Server Error" });
    });

    it("should include stack trace in development mode", () => {
      const originalEnv = env.NODE_ENV;
      env.NODE_ENV = "development";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at someFunction (file.ts:10:20)\n    at anotherFunction (file.ts:5:10)";

      jest.mock("@/config/env", () => ({
        __prod__: false,
      }));

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: "Test error",
          details: expect.stringContaining("someFunction"),
        }),
      );

      env.NODE_ENV = originalEnv;
    });

    it("should not include stack trace in production mode", () => {
      const originalEnv = env.NODE_ENV;
      env.NODE_ENV = "production";

      const error = new Error("Test error");
      error.stack = "Error: Test error\n    at someFunction (file.ts:10:20)\n    at anotherFunction (file.ts:5:10)";

      jest.mock("@/config/env", () => ({
        __prod__: true,
      }));

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Test error",
      });

      env.NODE_ENV = originalEnv;
    });

    it("should not include stack trace if error has no stack", () => {
      const error = new Error("Test error");
      delete error.stack;

      errorHandler(error, mockRequest, mockResponse, mockNext);

      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Test error",
      });
    });
  });
});
