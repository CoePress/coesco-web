import type { Chat, Message } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { chatRepository, messageRepository } from "@/repositories";

export class ChatService {
  async createChat(data: Partial<Chat>) {
    return chatRepository.create(data);
  }

  async updateChat(id: string, data: Partial<Chat>) {
    return chatRepository.update(id, data);
  }

  async deleteChat(id: string) {
    return chatRepository.delete(id);
  }

  async getAllChats(params?: IQueryParams<Chat>) {
    return chatRepository.getAll(params);
  }

  async getChatById(id: string, params?: IQueryParams<Chat>) {
    return chatRepository.getById(id, params);
  }

  async createMessage(data: Omit<Message, "id" | "createdAt" | "updatedAt">) {
    return messageRepository.create(data);
  }

  async updateMessage(id: string, data: Partial<Omit<Message, "id" | "createdAt" | "updatedAt">>) {
    return messageRepository.update(id, data);
  }

  async deleteMessage(id: string) {
    return messageRepository.delete(id);
  }

  async getAllMessages(params?: IQueryParams<Message>) {
    return messageRepository.getAll(params);
  }

  async getMessageById(id: string, params?: IQueryParams<Message>) {
    return messageRepository.getById(id, params);
  }
}
