import { logger } from "@/utils/logger";

import { messageService } from "../repository";

type ChatRole = "system" | "user" | "assistant";

export interface Message {
  id: string;
  chatId: string;
  role: ChatRole;
  content: string;
  createdAt: string; // ISO string for client
  updatedAt?: string;
  fileUrl?: string | null;
  createdById?: string | null;
  senderName?: string | null;
  avatarUrl?: string | null;
}

export class AgentService {
  async processMessage(chatId: string, userText: string): Promise<{
    userMsg: Message;
    assistantMsg: Message;
  }> {
    // save user message
    const userRes = await messageService.create({
      chatId,
      role: "user" as ChatRole,
      content: userText,
    } as any);

    if (!userRes?.data)
      throw new Error("Failed to create user message");
    const userMsg = this.toClientMessage(userRes.data);

    // get assistant reply and save
    const assistantReply = await this.callLLM(userText);
    const asstRes = await messageService.create({
      chatId,
      role: "assistant" as ChatRole,
      content: assistantReply,
    } as any);

    if (!asstRes?.data)
      throw new Error("Failed to create assistant message");
    const assistantMsg = this.toClientMessage(asstRes.data);

    return { userMsg, assistantMsg };
  }

  private toClientMessage(raw: any): Message {
    return {
      id: raw.id,
      chatId: raw.chatId,
      role: raw.role,
      content: raw.content,
      createdAt:
        raw.createdAt instanceof Date
          ? raw.createdAt.toISOString()
          : new Date(raw.createdAt).toISOString(),
      updatedAt: raw.updatedAt
        ? raw.updatedAt instanceof Date
          ? raw.updatedAt.toISOString()
          : new Date(raw.updatedAt).toISOString()
        : undefined,
      fileUrl: raw.fileUrl ?? null,
      createdById: raw.createdById ?? null,
      senderName: raw.senderName ?? null,
      avatarUrl: raw.avatarUrl ?? null,
    };
  }

  async callLLM(prompt: string): Promise<string> {
    logger.info(`Calling LLM with prompt: ${prompt}`);
    return `Echo: ${prompt}`;
  }
}
