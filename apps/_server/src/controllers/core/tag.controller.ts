import type { Tag } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { tagService } from "@/services";
import { buildQueryParams } from "@/utils";

export class TagController {
  async createTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.createTag(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTags(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Tag>(req.query);
      const result = await tagService.getAllTags(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.getTagById(req.params.tagId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.updateTag(req.params.tagId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteTag(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await tagService.deleteTag(req.params.tagId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
