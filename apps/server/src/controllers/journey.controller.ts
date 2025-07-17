import { journeyService } from "@/services/repository";
import { salesService } from "@/services";
import { BaseController } from "./_base.controller";
import { Journey } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class JourneyController extends BaseController<Journey> {
  protected service = journeyService;
  protected entityName = "Journey";

  public async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const result = await salesService.getJourneyOverview(id);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
