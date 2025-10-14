import type { Journey } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { journeyService } from "@/services";
import { buildQueryParams } from "@/utils";

export class JourneyController {
    async createJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.createJourney(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourneys(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Journey>(req.query);
      const result = await journeyService.getAllJourneys(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.getJourneyById(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.updateJourney(req.params.journeyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteJourney(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyService.deleteJourney(req.params.journeyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}