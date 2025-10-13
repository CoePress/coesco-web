import type { Request, Response } from "express";
import type { Configuration } from "@prisma/client";
import { z } from "zod";

import { configurationService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateConfigurationSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isTemplate: z.boolean(),
  legacy: z.record(z.any()).optional(),
});

const UpdateConfigurationSchema = CreateConfigurationSchema.partial();

export class ConfigurationController {
  createConfiguration = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateConfigurationSchema.parse(req.body);
    const result = await configurationService.createConfiguration(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getConfigurations = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Configuration>(req.query);
    const result = await configurationService.getAllConfigurations(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getConfiguration = asyncWrapper(async (req: Request, res: Response) => {
    const result = await configurationService.getConfigurationById(req.params.configurationId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateConfiguration = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateConfigurationSchema.parse(req.body);
    const result = await configurationService.updateConfiguration(req.params.configurationId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteConfiguration = asyncWrapper(async (req: Request, res: Response) => {
    await configurationService.deleteConfiguration(req.params.configurationId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
