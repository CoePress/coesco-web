import type { UserRole } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { verify } from "jsonwebtoken";

import { env } from "@/config/env";
import { ForbiddenError, UnauthorizedError } from "@/middleware/error.middleware";
import { permissionService } from "@/services";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

/**
 * Middleware to check if user has required permission(s)
 * @param permissions - Single permission or array of permissions (OR logic)
 * @param requireAll - If true with array, requires ALL permissions (AND logic)
 */
export function requirePermission(
  permissions: string | string[],
  requireAll = false,
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader?.startsWith("Bearer ")) {
        throw new UnauthorizedError("No valid authorization token provided");
      }

      const token = authHeader.substring(7);
      const decoded = verify(token, env.JWT_SECRET) as {
        userId: string;
        role: UserRole;
      };

      req.user = decoded;

      const permissionArray = Array.isArray(permissions) ? permissions : [permissions];

      // Validate all permissions exist
      for (const permission of permissionArray) {
        if (!permissionService.isValidPermission(permission)) {
          throw new Error(`Invalid permission: ${permission}`);
        }
      }

      let hasAccess = false;

      if (requireAll) {
        hasAccess = permissionService.hasAllPermissions(decoded.role, permissionArray);
      }
      else {
        hasAccess = permissionService.hasAnyPermission(decoded.role, permissionArray);
      }

      if (!hasAccess) {
        throw new ForbiddenError(
          `Insufficient permissions. Required: ${permissionArray.join(requireAll ? " AND " : " OR ")}`,
        );
      }

      next();
    }
    catch (error) {
      if (error instanceof UnauthorizedError || error instanceof ForbiddenError) {
        next(error);
      }
      else {
        next(new UnauthorizedError("Invalid or expired token"));
      }
    }
  };
}

/**
 * Middleware to check if user has admin role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  return requirePermission("system.all")(req, res, next);
}

/**
 * Middleware to authenticate user and attach user info to request
 */
export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedError("No valid authorization token provided");
    }

    const token = authHeader.substring(7);
    const decoded = verify(token, env.JWT_SECRET) as {
      userId: string;
      role: UserRole;
    };

    req.user = decoded;
    next();
  }
  catch (error) {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

/**
 * Get user permissions for current request
 */
export function getUserPermissions(req: AuthenticatedRequest): string[] {
  if (!req.user) {
    return [];
  }
  return permissionService.getRolePermissions(req.user.role);
}

/**
 * Check if current user has permission
 */
export function userHasPermission(req: AuthenticatedRequest, permission: string): boolean {
  if (!req.user) {
    return false;
  }
  return permissionService.hasPermission(req.user.role, permission);
}
