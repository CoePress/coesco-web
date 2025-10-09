import type { ExternalAccessLink } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { externalInvitationService } from "@/services";
import { buildQueryParams } from "@/utils";

export class ExternalInvitationController {
  async createInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await externalInvitationService.createInvitation(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<ExternalAccessLink>(req.query);
      const result = await externalInvitationService.getAllInvitations(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await externalInvitationService.getInvitationById(req.params.id);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async revokeInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await externalInvitationService.revokeInvitation(req.params.id);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async validateInvitation(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await externalInvitationService.validateInvitation(token);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async trackUsage(req: Request, res: Response, next: NextFunction) {
    try {
      const { token } = req.params;
      const result = await externalInvitationService.trackUsage(token);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getActiveInvitations(req: Request, res: Response, next: NextFunction) {
    try {
      const { purpose } = req.query;
      const result = await externalInvitationService.getActiveInvitations(purpose as any);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getInvitationStats(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await externalInvitationService.getInvitationStats();
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
