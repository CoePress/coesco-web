import type { JourneyNote } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { journeyNoteService } from "@/services";
import { buildQueryParams } from "@/utils";

export class JourneyNoteController {
  async createJourneyNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyNoteService.createJourneyNote(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourneyNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<JourneyNote>(req.query);
      const result = await journeyNoteService.getAllJourneyNotes(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getJourneyNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyNoteService.getJourneyNoteById(req.params.journeyNoteId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateJourneyNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyNoteService.updateJourneyNote(req.params.journeyNoteId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteJourneyNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await journeyNoteService.deleteJourneyNote(req.params.journeyNoteId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
