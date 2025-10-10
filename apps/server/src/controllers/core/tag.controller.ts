import type { Tag } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { tagService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class TagController {
  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Tag>(req.query);
      const result = await tagService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.getById(req.params.tagId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.update(req.params.tagId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.delete(req.params.tagId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}