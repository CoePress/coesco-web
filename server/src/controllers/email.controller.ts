import { emailService } from "@/services";
import { Request, Response, NextFunction } from "express";

export class EmailController {
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await emailService.getTemplates();
      res.status(200).json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const template = await emailService.getTemplate(slug);
      res.status(200).json({
        success: true,
        data: template,
      });
    } catch (error) {
      next(error);
    }
  }

  async saveTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await emailService.saveTemplate(req.body);
      res.status(200).json(template);
    } catch (error) {
      next(error);
    }
  }

  async deleteTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const { slug } = req.params;
      const template = await emailService.deleteTemplate(slug);
      res.status(200).json(template);
    } catch (error) {
      next(error);
    }
  }

  async sendEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await emailService.sendEmail(req.body);
      res.status(200).json(template);
    } catch (error) {
      next(error);
    }
  }
}
