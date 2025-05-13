import { __prod__ } from "@/config/config";
import { authService } from "@/services";
import { NextFunction, Request, Response } from "express";
import { config } from "@/config/config";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const response = await authService.login(email, password);

      res.cookie("accessToken", response.token, config.cookieOptions);
      res.cookie("refreshToken", response.refreshToken, config.cookieOptions);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async loginWithMicrosoft() {}

  async callback() {}

  async logout() {}

  async session() {}

  async testLogin(req: Request, res: Response, next: NextFunction) {
    if (__prod__) {
      throw new Error("Not available in production");
    }

    try {
      const response = await authService.testLogin();

      res.cookie("accessToken", response.token, config.cookieOptions);
      res.cookie("refreshToken", response.refreshToken, config.cookieOptions);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }
}
