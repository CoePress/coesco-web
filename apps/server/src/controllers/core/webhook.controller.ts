import type { Request, Response } from "express";

import { webhookService } from "@/services";
import { asyncWrapper } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

export class WebhookController {
  handleWebhook = asyncWrapper(async (req: Request, res: Response) => {
    const { event } = req.params;
    const payload = req.body;

    await webhookService.handleWebhook(event, payload, req);

    res.status(HTTP_STATUS.OK).json({ success: true, message: "Webhook processed successfully" });
  });

  getRegisteredEvents = asyncWrapper(async (req: Request, res: Response) => {
    const events = webhookService.getRegisteredEvents();
    res.status(HTTP_STATUS.OK).json({ events });
  });
}
