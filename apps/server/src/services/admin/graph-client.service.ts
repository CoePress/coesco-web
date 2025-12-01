import { Client } from "@microsoft/microsoft-graph-client";
import "isomorphic-fetch";

import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";

import { graphAuthService } from "./graph-auth.service";

export class GraphClientService {
  private async getClient(employeeId: string) {
    const accessToken = await graphAuthService.getValidToken(employeeId);

    return Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      },
    });
  }

  async getUserByEmail(employeeId: string, email: string) {
    const client = await this.getClient(employeeId);

    try {
      const users = await client
        .api("/users")
        .filter(`mail eq '${email}' or userPrincipalName eq '${email}'`)
        .select("id,displayName,mail,userPrincipalName")
        .get();

      if (!users.value || users.value.length === 0) {
        throw new Error(`User not found: ${email}`);
      }

      return users.value[0];
    }
    catch (error: any) {
      logger.error("Error finding user by email", {
        email,
        error: error.message,
        stack: error.stack,
        statusCode: error.statusCode,
        body: error.body,
      });
      throw new Error(`Failed to find user ${email}: ${error.message}`);
    }
  }

  async findOrCreateChat(
    employeeId: string,
    recipientUserId: string,
  ): Promise<string> {
    const client = await this.getClient(employeeId);
    const me = await client.api("/me").select("id").get();

    const cached = await prisma.teamsChatCache.findUnique({
      where: {
        employeeId_recipientUserId: {
          employeeId,
          recipientUserId,
        },
      },
    });

    if (cached) {
      await prisma.teamsChatCache.update({
        where: { id: cached.id },
        data: { lastUsedAt: new Date() },
      });
      return cached.chatId;
    }

    if (me.id === recipientUserId) {
      logger.info("Self-messaging detected, searching for existing chats...", { userId: me.id });

      const chats = await client
        .api("/me/chats")
        .select("id,chatType,members")
        .top(50)
        .get();

      logger.info("Found chats", {
        totalChats: chats.value?.length || 0,
        chats: chats.value?.map((c: any) => ({
          id: c.id,
          type: c.chatType,
          memberCount: c.members?.length,
          memberIds: c.members?.map((m: any) => m.userId),
        })),
      });

      const selfChat = chats.value.find((chat: any) => {
        const isOneOnOne = chat.chatType === "oneOnOne";
        const hasMembers = chat.members?.length >= 1;
        const allMembersAreMe = chat.members?.every((m: any) => m.userId === me.id);

        logger.info("Checking chat", {
          chatId: chat.id,
          isOneOnOne,
          hasMembers,
          memberCount: chat.members?.length,
          allMembersAreMe,
          memberIds: chat.members?.map((m: any) => m.userId),
        });

        return isOneOnOne && hasMembers && (chat.members.length === 1 || allMembersAreMe);
      });

      if (selfChat) {
        logger.info("Found existing self-chat", { chatId: selfChat.id });

        await prisma.teamsChatCache.create({
          data: {
            employeeId,
            recipientUserId,
            chatId: selfChat.id,
          },
        });

        return selfChat.id;
      }

      throw new Error("No existing chat with yourself found. Please start a chat with yourself in Teams first, then try again.");
    }

    const chatData = {
      chatType: "oneOnOne",
      members: [
        {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          "roles": ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users/${me.id}`,
        },
        {
          "@odata.type": "#microsoft.graph.aadUserConversationMember",
          "roles": ["owner"],
          "user@odata.bind": `https://graph.microsoft.com/v1.0/users/${recipientUserId}`,
        },
      ],
    };

    const chat = await client.api("/chats").post(chatData);

    await prisma.teamsChatCache.create({
      data: {
        employeeId,
        recipientUserId,
        chatId: chat.id,
      },
    });

    return chat.id;
  }

  async sendChatMessage(
    employeeId: string,
    chatId: string,
    message: string,
  ): Promise<void> {
    const client = await this.getClient(employeeId);

    const messageData = {
      body: {
        contentType: "text",
        content: message,
      },
    };

    await client.api(`/chats/${chatId}/messages`).post(messageData);

    logger.info("Teams DM sent", { employeeId, chatId });
  }

  async sendDirectMessage(
    employeeId: string,
    recipientEmail: string,
    message: string,
  ): Promise<void> {
    try {
      logger.info("Starting sendDirectMessage", { employeeId, recipientEmail });

      logger.info("Getting user by email...");
      const recipient = await this.getUserByEmail(employeeId, recipientEmail);
      logger.info("User found", { recipientId: recipient.id });

      logger.info("Finding or creating chat...");
      const chatId = await this.findOrCreateChat(employeeId, recipient.id);
      logger.info("Chat ready", { chatId });

      logger.info("Sending chat message...");
      await this.sendChatMessage(employeeId, chatId, message);
      logger.info("Message sent successfully");
    }
    catch (error: any) {
      logger.error("sendDirectMessage failed", {
        employeeId,
        recipientEmail,
        error: error.message,
        stack: error.stack,
      });
      throw error;
    }
  }
}

export const graphClientService = new GraphClientService();
