import { __prod__ } from "@/config/config";
import { authService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const response = await authService.login(email, password);
      res.cookie("auth_session", response.sessionId, {
        httpOnly: true,
        secure: __prod__,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
      });
      res.status(200).json({ url: response.url });
    } catch (error) {
      next(error);
    }
  }

  async loginWithMicrosoft() {}

  async callback() {}

  async logout() {}

  async session() {
    try {
      res.status(201).json({
        success: true,
        message: "Registration successful. Please verify your email.",
        userId: "123",
      });
    } catch (error: any) {
      next(error);
    }
  }
}
