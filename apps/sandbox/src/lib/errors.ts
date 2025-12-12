export type ErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "RATE_LIMITED"
  | "INTERNAL";

export class AppError extends Error {
  public readonly status: number;
  public readonly code: ErrorCode;
  public readonly details?: unknown;
  public readonly expose: boolean;

  constructor(opts: {
    status: number;
    code: ErrorCode;
    message: string;
    details?: unknown;
    expose?: boolean;
  }) {
    super(opts.message);
    this.name = "AppError";
    this.status = opts.status;
    this.code = opts.code;
    this.details = opts.details;
    this.expose = opts.expose ?? true;
  }
}

export const errors = {
  badRequest: (message = "Bad request", details?: unknown) =>
    new AppError({ status: 400, code: "BAD_REQUEST", message, details }),

  unauthorized: (message = "Unauthorized", details?: unknown) =>
    new AppError({ status: 401, code: "UNAUTHORIZED", message, details }),

  forbidden: (message = "Forbidden", details?: unknown) =>
    new AppError({ status: 403, code: "FORBIDDEN", message, details }),

  notFound: (message = "Not found", details?: unknown) =>
    new AppError({ status: 404, code: "NOT_FOUND", message, details }),

  conflict: (message = "Conflict", details?: unknown) =>
    new AppError({ status: 409, code: "CONFLICT", message, details }),

  rateLimited: (message = "Too many requests", details?: unknown) =>
    new AppError({ status: 429, code: "RATE_LIMITED", message, details }),

  internal: (message = "Internal Server Error", details?: unknown) =>
    new AppError({ status: 500, code: "INTERNAL", message, details, expose: false }),
};

export function isAppError(err: unknown): err is AppError {
  return !!err && typeof err === "object" && (err as any).name === "AppError";
}
