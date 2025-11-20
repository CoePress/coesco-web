import type { Request, Response } from "express";

import { z } from "zod";

import { teamsService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const SendChannelMessageSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  message: z.string().min(1, "Message is required"),
  title: z.string().optional(),
  themeColor: z.string().optional(),
  mentionEmails: z.array(z.string().email()).optional(),
});

const SendAdaptiveCardSchema = z.object({
  webhookUrl: z.string().url("Invalid webhook URL").optional(),
  card: z.any(),
});

export class TeamsController {
  sendChannelMessage = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SendChannelMessageSchema.parse(req.body);
    const result = await teamsService.sendChannelMessage(validData);
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  });

  sendAdaptiveCard = asyncWrapper(async (req: Request, res: Response) => {
    const validData = SendAdaptiveCardSchema.parse(req.body);
    const result = await teamsService.sendAdaptiveCard({
      webhookUrl: validData.webhookUrl,
      card: validData.card,
      message: "",
    });
    res.status(HTTP_STATUS.OK).json({ success: true, data: result });
  });
}
