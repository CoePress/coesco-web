import axios from "axios";

import { env } from "@/config/env";
import { InternalServerError } from "@/middleware/error.middleware";
import { logger } from "@/utils/logger";

export interface ChannelMessageOptions {
  webhookUrl?: string;
  message: string;
  title?: string;
  themeColor?: string;
  mentionEmails?: string[];
}

interface AdaptiveCardTextBlock {
  type: "TextBlock";
  text: string;
  weight?: "Bolder";
  size?: "Large";
  color?: string;
  wrap?: boolean;
}

interface TeamsMention {
  type: "mention";
  text: string;
  mentioned: {
    id: string;
    name: string;
  };
}

interface AdaptiveCard {
  type: "AdaptiveCard";
  version: "1.2";
  body: AdaptiveCardTextBlock[];
  msteams?: {
    entities: TeamsMention[];
  };
}

interface TeamsWebhookPayload {
  type: "message";
  attachments: Array<{
    contentType: "application/vnd.microsoft.card.adaptive";
    content: AdaptiveCard | Record<string, unknown>;
  }>;
}

export class TeamsService {
  async sendChannelMessage(options: ChannelMessageOptions) {
    try {
      logger.info("Sending Teams channel message");

      const webhookUrl = options.webhookUrl || env.TEAMS_WEBHOOK_URL;

      const textBlocks: AdaptiveCardTextBlock[] = [];

      if (options.title) {
        textBlocks.push({
          type: "TextBlock",
          text: options.title,
          weight: "Bolder",
          size: "Large",
          color: this.getColorFromHex(options.themeColor),
        });
      }

      let messageText = options.message;
      const mentions: TeamsMention[] = [];

      if (options.mentionEmails && options.mentionEmails.length > 0) {
        const mentionTags = options.mentionEmails
          .map((email) => `<at>${email}</at>`)
          .join(" ");

        messageText = `${mentionTags}\n\n${messageText}`;

        options.mentionEmails.forEach((email) => {
          mentions.push({
            type: "mention",
            text: `<at>${email}</at>`,
            mentioned: {
              id: email,
              name: email.split("@")[0],
            },
          });
        });
      }

      textBlocks.push({
        type: "TextBlock",
        text: messageText,
        wrap: true,
      });

      const card: AdaptiveCard = {
        type: "AdaptiveCard",
        version: "1.2",
        body: textBlocks,
      };

      if (mentions.length > 0) {
        card.msteams = {
          entities: mentions,
        };
      }

      const payload: TeamsWebhookPayload = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: card,
          },
        ],
      };

      await axios.post(webhookUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      logger.info("Successfully sent Teams channel message");
      return { success: true };
    }
    catch (error: any) {
      logger.error("Failed to send Teams channel message:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new InternalServerError("Failed to send Teams channel message");
    }
  }

  private getColorFromHex(hex?: string): string {
    if (!hex)
      return "Default";

    const colorMap: Record<string, string> = {
      "0078D4": "Default",
      "28A745": "Good",
      "FFC107": "Warning",
      "DC3545": "Attention",
    };

    return colorMap[hex.toUpperCase()] || "Default";
  }

  async sendAdaptiveCard(options: ChannelMessageOptions & { card: Record<string, unknown> }) {
    try {
      logger.info("Sending Teams Adaptive Card");

      const webhookUrl = options.webhookUrl || env.TEAMS_WEBHOOK_URL;

      const payload: TeamsWebhookPayload = {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: options.card,
          },
        ],
      };

      await axios.post(webhookUrl, payload, {
        headers: { "Content-Type": "application/json" },
      });

      logger.info("Successfully sent Teams Adaptive Card");
      return { success: true };
    }
    catch (error: any) {
      logger.error("Failed to send Teams Adaptive Card:", {
        error: error.response?.data || error.message,
        status: error.response?.status,
      });
      throw new InternalServerError("Failed to send Teams Adaptive Card");
    }
  }
}
