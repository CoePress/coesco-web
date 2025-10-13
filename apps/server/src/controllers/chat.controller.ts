import type { Chat, Message } from "@prisma/client";
import type { Request, Response } from "express";
import { z } from "zod";

import { chatService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateChatSchema = z.object({
  title: z.string().optional(),
  userId: z.string().uuid("Invalid user ID").optional(),
});

const UpdateChatSchema = CreateChatSchema.partial();

const CreateMessageSchema = z.object({
  chatId: z.string().uuid("Invalid chat ID"),
  role: z.enum(["user", "assistant", "system"]),
  content: z.string().min(1, "Content is required"),
});

const UpdateMessageSchema = CreateMessageSchema.partial();

export class ChatController {
  createChat = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateChatSchema.parse(req.body);
    const result = await chatService.createChat(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getChats = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Chat>(req.query);
    const result = await chatService.getAllChats(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getChat = asyncWrapper(async (req: Request, res: Response) => {
    const result = await chatService.getChatById(req.params.chatId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateChat = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateChatSchema.parse(req.body);
    const result = await chatService.updateChat(req.params.chatId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteChat = asyncWrapper(async (req: Request, res: Response) => {
    await chatService.deleteChat(req.params.chatId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  getMessages = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<Message>(req.query);
    params.filter = { chatId: req.params.chatId } as Partial<Message>;
    const result = await chatService.getAllMessages(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  createMessage = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateMessageSchema.parse(req.body);
    const result = await chatService.createMessage(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  updateMessage = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateMessageSchema.parse(req.body);
    const result = await chatService.updateMessage(req.params.messageId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteMessage = asyncWrapper(async (req: Request, res: Response) => {
    await chatService.deleteMessage(req.params.messageId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
