import { __prod__ } from "@/config/config";
import { authService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const response = await authService.login(email, password);
    } catch (error) {
      next(error);
    }
  }

  async loginWithMicrosoft() {}

  async callback() {}

  async logout() {}

  async session() {}
}
