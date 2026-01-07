import type { NextFunction, Request, Response } from "express";

import { cookieOptions } from "@/config/env";
import { authService, sessionService } from "@/services";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { username, password } = req.body;
      const result = await authService.login(username, password, req);
      res.cookie("accessToken", result.token, cookieOptions);
      res.cookie("refreshToken", result.refreshToken, cookieOptions);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async microsoftLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.microsoftLogin();
      res.json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async microsoftCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.body;
      const result = await authService.microsoftCallback(
        code as string,
        state as string,
        req,
      );

      res.cookie("accessToken", result.token, cookieOptions);
      res.cookie("refreshToken", result.refreshToken, cookieOptions);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = req.cookies;

      if (accessToken) {
        const session = await sessionService.validateSession(accessToken);
        if (session) {
          await sessionService.logout(session.id);
        }
      }

      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);

      res.json({ message: "Logged out successfully" });
    }
    catch (error) {
      next(error);
    }
  }

  async session(req: Request, res: Response, next: NextFunction) {
    try {
      const { accessToken } = req.cookies;
      const result = await authService.session(accessToken);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.cookies;
      const result = await authService.refreshAccessToken(refreshToken, req);
      res.cookie("accessToken", result.token, cookieOptions);
      res.cookie("refreshToken", result.refreshToken, cookieOptions);
      res.status(200).json(result);
    }
    catch (error) {
      res.clearCookie("accessToken", cookieOptions);
      res.clearCookie("refreshToken", cookieOptions);
      next(error);
    }
  }
}
