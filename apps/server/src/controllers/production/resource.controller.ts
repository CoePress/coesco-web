import type { Machine } from "@prisma/client";
import type { Request, Response } from "express";

import { MachineControllerType, MachineType } from "@prisma/client";
import { z } from "zod";

import { resourceService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateMachineSchema = z.object({
  slug: z.string().min(1, "Slug is required").max(255),
  name: z.string().min(1, "Name is required").max(255),
  type: z.nativeEnum(MachineType),
  controllerType: z.nativeEnum(MachineControllerType),
  connectionUrl: z.string().url("Invalid connection URL").optional().or(z.literal("")),
  enabled: z.boolean().optional(),
});

const UpdateMachineSchema = CreateMachineSchema.partial();

export class ResourceController {
  createResource = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateMachineSchema.parse(req.body);
    const result = await resourceService.createResource(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getAllResources = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Machine>(req.query);
    const result = await resourceService.getAllResources(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getResourceById = asyncWrapper(async (req: Request, res: Response) => {
    const result = await resourceService.getResourceById(req.params.resourceId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateResource = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateMachineSchema.parse(req.body);
    const result = await resourceService.updateResource(req.params.resourceId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteResource = asyncWrapper(async (req: Request, res: Response) => {
    await resourceService.deleteResource(req.params.resourceId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
