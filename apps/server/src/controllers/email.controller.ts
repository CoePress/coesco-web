import { emailService } from "@/services";
import { NextFunction, Request, Response } from "express";

export class EmailController {
  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { from, to, subject, html, text } = req.body;
      const result = await emailService.sendEmail({ from, to, subject, html, text });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async sendBugReport(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, userEmail, screenshot, url, userAgent } = req.body;
      const result = await emailService.sendBugReport({
        title,
        description,
        userEmail,
        screenshot,
        url,
        userAgent,
      });
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}