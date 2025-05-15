import { emailService } from "@/services";
import { Request, Response, NextFunction } from "express";

export class EmailController {
  async getTemplates(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await emailService.getTemplates();
      res.status(200).json(templates);
    } catch (error) {
      next(error);
    }
  }

  async getTemplate(req: Request, res: Response, next: NextFunction) {
    try {
      const template = await emailService.getTemplate(req.params.id);
      res.status(200).json(template);
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
      const template = await emailService.deleteTemplate(req.params.id);
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
