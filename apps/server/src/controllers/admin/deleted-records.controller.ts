import type { Request, Response } from "express";

import { deletedRecordsService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class DeletedRecordsController {
  getDeletedRecords = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<any>(req.query);
    const result = await deletedRecordsService.getAllDeletedRecords(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getModelNames = asyncWrapper(async (req: Request, res: Response) => {
    const modelNames = deletedRecordsService.getModelNames();
    res.status(HTTP_STATUS.OK).json({ modelNames });
  });

  restoreRecord = asyncWrapper(async (req: Request, res: Response) => {
    const { modelName, id } = req.params;
    const result = await deletedRecordsService.restoreRecord(modelName, id);
    res.status(HTTP_STATUS.OK).json(result);
  });

  hardDeleteRecord = asyncWrapper(async (req: Request, res: Response) => {
    const { modelName, id } = req.params;
    const result = await deletedRecordsService.hardDeleteRecord(modelName, id);
    res.status(HTTP_STATUS.OK).json(result);
  });
}

export const deletedRecordsController = new DeletedRecordsController();
