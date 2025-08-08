import type { NextFunction, Request, Response } from "express";

import { authService } from "../services/core";

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.login();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async microsoftLogin(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.microsoftLogin();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async microsoftCallback(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.microsoftCallback();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.logout();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.me();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.getSessions();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteSessions(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.deleteSessions();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteSession(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.deleteSession();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async recentActivity(req: Request, res: Response, next: NextFunction) {
    try {
      const result = authService.recentActivity();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
