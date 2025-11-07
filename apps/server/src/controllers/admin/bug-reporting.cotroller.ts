import type { Request, Response } from "express";

import { z } from "zod";

import { bugReportingService } from "@/services";
import { asyncWrapper } from "@/utils";
import { getEmployeeContext } from "@/utils/context";
import { HTTP_STATUS } from "@/utils/constants";

const CreateBugReportSchema = z.object({
  description: z.string().min(1, "Description is required"),
  userEmail: z.string().email("Invalid email").optional(),
  userName: z.string().optional(),
  screenshot: z.string().optional(),
  url: z.string().url("Invalid URL").optional(),
  userAgent: z.string().optional(),
});

export class BugReportingController {
  sendBugReport = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateBugReportSchema.parse(req.body);
    const result = await bugReportingService.createBugReport(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getMyBugReports = asyncWrapper(async (req: Request, res: Response) => {
    const ctx = getEmployeeContext();
    if (!ctx.id) {
      return res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: "User not authenticated" });
    }
    const result = await bugReportingService.getUserBugReports(ctx.id);
    res.status(HTTP_STATUS.OK).json(result);
  });
}
