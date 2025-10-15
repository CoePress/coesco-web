import type { LoginHistory, Session } from "@prisma/client";
import type { Request, Response } from "express";

import { loginHistoryService, sessionService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class SessionsController {
  getSessions = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Session>(req.query);
    const result = await sessionService.getAllSessions(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getLoginHistory = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<LoginHistory>(req.query);
    const result = await loginHistoryService.getAllLoginHistory(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  revokeSession = asyncWrapper(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    await sessionService.revokeSession(id, reason);
    res.status(HTTP_STATUS.OK).json({ success: true, message: "Session revoked" });
  });

  revokeUserSessions = asyncWrapper(async (req: Request, res: Response) => {
    const { userId } = req.params;
    const count = await sessionService.revokeAllSessions(userId);
    res.status(HTTP_STATUS.OK).json({ success: true, count, message: `Revoked ${count} sessions` });
  });
}
