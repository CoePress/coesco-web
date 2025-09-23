import type { Request, Response } from "express";

import { userSettingsService } from "@/services/repository";
import { asyncWrapper } from "@/utils";

export class UserSettingsController {
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
