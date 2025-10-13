import type { Chat, Message } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import { chatService } from "@/services";
import { buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class ChatController {
  async createChat(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await chatService.createChat(data);
      res.status(HTTP_STATUS.CREATED).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async getChats(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<Chat>(req.query);
      const result = await chatService.getAllChats(params);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async getChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.getChatById(chatId);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async updateChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.updateChat(chatId, req.body);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async deleteChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const result = await chatService.deleteChat(chatId);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  };

  async getMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { chatId } = req.params;
      const params = buildQueryParams<Message>(req.query);
      params.filter = { chatId } as Partial<Message>;
      const result = await chatService.getAllMessages(params);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async createMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body;
      const result = await chatService.createMessage(data);
      res.status(201).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const result = await chatService.updateMessage(messageId, req.body);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { messageId } = req.params;
      const result = await chatService.deleteMessage(messageId);
      res.status(HTTP_STATUS.OK).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
