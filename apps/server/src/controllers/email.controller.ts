import type { NextFunction, Request, Response } from "express";

import { emailService, jiraService } from "@/services";

export class EmailController {
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, subject, html, text } = req.body;
      const result = await emailService.sendEmail({ from, to, subject, html, text });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async sendBugReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, userEmail, screenshot, url, userAgent } = req.body;

      const result = await jiraService.createBugIssue({
        title,
        description,
        userEmail,
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
