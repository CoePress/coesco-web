import type { Message } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { messageRepository } from "@/repositories";

export class MessageService {
  async createMessage(data: Partial<Message>) {
    return messageRepository.create(data);
  }

  async updateMessage(id: string, data: Partial<Message>) {
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
