import User from "@/models/user";
import { NextFunction, Request, Response } from "express";
import { decode } from "jsonwebtoken";
import { AppError } from "./error-handler";
import { IAuthRequest, IPermission } from "@/utils/types";

export const protect = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.cookies.auth_token;

    if (!token) {
      throw new AppError(401, "Authentication required");
    }

    const decoded = decode(token) as { oid: string };

    if (!decoded?.oid) {
      throw new AppError(400, "Invalid token format");
    }

    const user = await User.findOne({
      where: { microsoftId: decoded.oid },
    });

    if (!user) {
      throw new AppError(404, "User not found");
    }

    (req as IAuthRequest).user = user;

    next();
  } catch (err) {
    res.clearCookie("auth_token");
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
};

export const checkPermissions = (permissions: IPermission) => {
  return (req: IAuthRequest, res: Response, next: NextFunction) => {
    const hasPermission =
      (!permissions.roles || permissions.roles.includes(req.user.role)) &&
      (!permissions.customCheck || permissions.customCheck(req.user));

    if (!hasPermission) {
      throw new AppError(403, "Insufficient permissions");
    }

    next();
  };
};

export const requireAdmin = checkPermissions({ roles: ["admin"] });

export const requireManager = checkPermissions({
  roles: ["admin", "manager"],
});
