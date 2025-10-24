import type { Request } from "express";

import { logger } from "@/utils/logger";

export async function handleTestWebhook(payload: any, req: Request): Promise<void> {
  logger.info("[Webhook] Test webhook received:", {
    payload,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
}

export async function handleNotificationWebhook(payload: any, _req: Request): Promise<void> {
  logger.info("[Webhook] Notification received:", {
    message: payload.message,
    type: payload.type,
    timestamp: new Date().toISOString(),
  });
}

export async function handleDataSyncWebhook(payload: any, _req: Request): Promise<void> {
  logger.info("[Webhook] Data sync webhook received:", {
    entity: payload.entity,
    action: payload.action,
    timestamp: new Date().toISOString(),
  });
}
