import type { Chat } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { chatService, messageService } from "@/services/repository";
import { buildQueryParams } from "@/utils";

export class ChatController {
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

  async getChats(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Chat>(req.query);
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
      const limit = Number.parseInt(req.query.limit as string) || 25;
      const page = Number.parseInt(req.query.page as string) || 1;

      const result = await messageService.getAll({
        filter: {
          chatId,
        },
        sort: "createdAt",
        order: "desc",
        page,
        limit,
      });
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
