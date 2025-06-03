import { journeyService } from "@/services";
import { BaseController } from "./_";
import { Journey } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

export class JourneyController extends BaseController<Journey> {
  protected service = journeyService;
  protected entityName = "Journey";

  public async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      const result = {};
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }
}
