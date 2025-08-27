import type { NextFunction, Request, Response } from "express";

import { cookieOptions } from "@/config/env";
import { authService } from "@/services";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
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
      const url = await authService.microsoftLogin();
      res.json({ url });
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
}
