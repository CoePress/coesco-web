import { jiraService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class BugReportingController {
    async sendBugReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { description, userEmail, userName, screenshot, url, userAgent } = req.body;

      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const title = userName ? `Bug Report - ${userName} - ${dateStr}` : `Bug Report - ${dateStr}`;

      const result = await jiraService.createBugIssue({
        title,
        description,
        userEmail,
        userName,
        screenshot,
        url,
        userAgent,
      });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}