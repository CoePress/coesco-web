import type { Request, Response } from "express";
import type { Permission } from "@prisma/client";
import { z } from "zod";

import { permissionService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreatePermissionSchema = z.object({
  resource: z.string().min(1, "Resource is required"),
  action: z.string().min(1, "Action is required"),
  description: z.string().optional(),
  condition: z.record(z.any()).optional(),
});

const UpdatePermissionSchema = CreatePermissionSchema.partial();

export class PermissionController {
  createPermission = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreatePermissionSchema.parse(req.body);
    const result = await permissionService.createPermission(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getPermissions = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Permission>(req.query);
    const result = await permissionService.getAllPermissions(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getPermission = asyncWrapper(async (req: Request, res: Response) => {
    const result = await permissionService.getPermissionById(req.params.permissionId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updatePermission = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdatePermissionSchema.parse(req.body);
    const result = await permissionService.updatePermission(req.params.permissionId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deletePermission = asyncWrapper(async (req: Request, res: Response) => {
    await permissionService.deletePermission(req.params.permissionId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}