import type { Request, Response } from "express";

import { z } from "zod";

import { bugReportingService } from "@/services";
import { asyncWrapper } from "@/utils";
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
}
