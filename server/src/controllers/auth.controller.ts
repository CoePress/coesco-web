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

  async loginWithMicrosoft(req: Request, res: Response, next: NextFunction) {
    try {
      const url = await authService.loginWithMicrosoft();
      res.json({ url });
    } catch (error) {
      next(error);
    }
  }

  async callback(req: Request, res: Response, next: NextFunction) {
    try {
      const { code, state } = req.body;
      const response = await authService.callback(
        code as string,
        state as string
      );

      res.cookie("accessToken", response.token, config.cookieOptions);
      res.cookie("refreshToken", response.refreshToken, config.cookieOptions);

      res.json(response);
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      res.clearCookie("accessToken", config.cookieOptions);
      res.clearCookie("refreshToken", config.cookieOptions);

      res.json({ message: "Logged out successfully" });
    } catch (error) {
      next(error);
    }
  }

  async session(req: Request, res: Response, next: NextFunction) {
    try {
      const accessToken = req.cookies.accessToken;
      const response = await authService.session(accessToken);
      res.json(response);
    } catch (error) {
      next(error);
    }
  }

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
