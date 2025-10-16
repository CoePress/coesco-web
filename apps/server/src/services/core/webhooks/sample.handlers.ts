import type { Request } from "express";

export async function handleTestWebhook(payload: any, req: Request): Promise<void> {
  console.log("[Webhook] Test webhook received:", {
    payload,
    timestamp: new Date().toISOString(),
    ip: req.ip,
  });
}

export async function handleNotificationWebhook(payload: any, req: Request): Promise<void> {
  console.log("[Webhook] Notification received:", {
    message: payload.message,
    type: payload.type,
    timestamp: new Date().toISOString(),
  });
}

export async function handleDataSyncWebhook(payload: any, req: Request): Promise<void> {
  console.log("[Webhook] Data sync webhook received:", {
    entity: payload.entity,
    action: payload.action,
    timestamp: new Date().toISOString(),
  });
}
