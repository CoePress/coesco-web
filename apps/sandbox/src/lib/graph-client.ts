import { graphAuthService } from "./graph-auth";
import logger from "./logger";

interface GraphApiOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: any;
  headers?: Record<string, string>;
}

export class GraphClientService {
  private baseUrl = "https://graph.microsoft.com/v1.0";

  async request<T = any>(userId: string, endpoint: string, options: GraphApiOptions = {}): Promise<T> {
    const accessToken = await graphAuthService.getValidToken(userId);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method: options.method || "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      logger.error("graph.api_error", { endpoint, status: response.status, error });
      throw new Error(`Graph API error: ${response.status} - ${error}`);
    }

    return response.json();
  }

  async getRecentEmails(userId: string, top: number = 10) {
    return this.request(userId, `/me/messages?$top=${top}&$orderby=receivedDateTime desc`);
  }

  async getEmail(userId: string, messageId: string) {
    return this.request(userId, `/me/messages/${messageId}`);
  }

  async getUpcomingEvents(userId: string, days: number = 7) {
    const startDateTime = new Date().toISOString();
    const endDateTime = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

    return this.request(
      userId,
      `/me/calendarView?startDateTime=${startDateTime}&endDateTime=${endDateTime}&$orderby=start/dateTime`,
    );
  }

  async getEvent(userId: string, eventId: string) {
    return this.request(userId, `/me/events/${eventId}`);
  }

  async getChats(userId: string) {
    return this.request(userId, "/me/chats");
  }

  async getChatMessages(userId: string, chatId: string, top: number = 50) {
    return this.request(userId, `/me/chats/${chatId}/messages?$top=${top}`);
  }

  async sendChatMessage(userId: string, chatId: string, content: string) {
    return this.request(userId, `/me/chats/${chatId}/messages`, {
      method: "POST",
      body: {
        body: {
          contentType: "text",
          content,
        },
      },
    });
  }

  async createOneOnOneChat(userId: string, recipientMicrosoftUserId: string) {
    const me = await this.request(userId, "/me?$select=id");

    return this.request(userId, "/chats", {
      method: "POST",
      body: {
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
            "user@odata.bind": `https://graph.microsoft.com/v1.0/users/${recipientMicrosoftUserId}`,
          },
        ],
      },
    });
  }

  async getMe(userId: string) {
    return this.request(userId, "/me");
  }

  async getUserByEmail(userId: string, email: string) {
    const result = await this.request(
      userId,
      `/users?$filter=mail eq '${email}' or userPrincipalName eq '${email}'&$select=id,displayName,mail`,
    );
    return result.value?.[0];
  }
}

export const graphClientService = new GraphClientService();
