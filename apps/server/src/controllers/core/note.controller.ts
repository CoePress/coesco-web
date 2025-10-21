import type { Note } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { noteService } from "@/services";
import { buildQueryParams } from "@/utils";

export class NoteController {
  async createNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noteService.createNote(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getNotes(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Note>(req.query);
      const result = await noteService.getAllNotes(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noteService.getNoteById(req.params.noteId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noteService.updateNote(req.params.noteId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteNote(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await noteService.deleteNote(req.params.noteId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
