import type { Request, Response } from "express";

import { authService } from "@/services";
import { userSettingsService } from "@/services/repository";
import { asyncWrapper } from "@/utils";

export class SettingsController {
  requestPasswordReset = asyncWrapper(async (req: Request, res: Response) => {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email is required",
      });
    }

    const result = await authService.requestPasswordReset(email);
    res.status(200).json(result);
  });

  resetPassword = asyncWrapper(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Token and new password are required",
      });
    }

    const result = await authService.resetPassword(token, newPassword);
    res.status(result.success ? 200 : 400).json(result);
  });

  changePassword = asyncWrapper(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    const userId = (req as any).user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized",
      });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: "Current password and new password are required",
      });
    }

    const result = await authService.changePassword(userId, currentPassword, newPassword);
    res.status(result.success ? 200 : 400).json(result);
  });

  createUserSettings = asyncWrapper(async (req: Request, res: Response) => {
    const result = await userSettingsService.create(req.body);
    res.status(201).json(result);
  });

  getUserSettings = asyncWrapper(async (req: Request, res: Response) => {
    const result = await userSettingsService.getAll(req.query);
    res.status(200).json(result);
  });

  getUserSetting = asyncWrapper(async (req: Request, res: Response) => {
    const result = await userSettingsService.getById(req.params.id);
    res.status(200).json(result);
  });

  updateUserSettings = asyncWrapper(async (req: Request, res: Response) => {
    const result = await userSettingsService.update(req.params.id, req.body);
    res.status(200).json(result);
  });

  deleteUserSettings = asyncWrapper(async (req: Request, res: Response) => {
    await userSettingsService.delete(req.params.id);
    res.status(204).send();
  });
}
