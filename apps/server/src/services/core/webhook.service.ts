import type { Request } from "express";

import { handleDataSyncWebhook, handleNotificationWebhook, handleTestWebhook } from "./webhooks/sample.handlers";

export type WebhookHandler = (payload: any, req: Request) => Promise<void> | void;

export class WebhookService {
  private handlers: Map<string, WebhookHandler> = new Map();

  async initialize(): Promise<void> {
    this.registerHandler("test", handleTestWebhook);
    this.registerHandler("notification", handleNotificationWebhook);
    this.registerHandler("data.sync", handleDataSyncWebhook);
  }

  registerHandler(event: string, handler: WebhookHandler): void {
    this.handlers.set(event, handler);
  }

  async handleWebhook(event: string, payload: any, req: Request): Promise<void> {
    const handler = this.handlers.get(event);

    if (!handler) {
      throw new Error(`No handler registered for webhook event: ${event}`);
    }

    await handler(payload, req);
  }

  getRegisteredEvents(): string[] {
    return Array.from(this.handlers.keys());
  }
}
