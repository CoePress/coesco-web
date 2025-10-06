import type { Request, Response } from "express";

import { userSettingsService } from "@/services/repository";
import { asyncWrapper } from "@/utils";
import { authService } from "@/services";

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
