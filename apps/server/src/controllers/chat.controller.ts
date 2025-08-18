import type { Chat } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { chatService, messageService } from "@/services/repository";

export class ChatController {
  async getChats(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;

      const params: IQueryParams<Chat> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Chat>,
        include: include ? JSON.parse(include as string) : undefined,
      };

      const result = await chatService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async getChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.getById(chatId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async createChat(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await chatService.create(data);
      res.status(201).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async updateChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.update(chatId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async deleteChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.delete(chatId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await messageService.getAll({
        filter: {
          chatId,
        },
      });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
