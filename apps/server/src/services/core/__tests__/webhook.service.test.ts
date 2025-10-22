import type { Request } from "express";

import { WebhookService } from "../webhook.service";

describe("webhookService", () => {
  let webhookService: WebhookService;

  beforeEach(() => {
    webhookService = new WebhookService();
  });

  describe("initialize", () => {
    it("should register default handlers", async () => {
      await webhookService.initialize();

      const events = webhookService.getRegisteredEvents();

      expect(events).toContain("test");
      expect(events).toContain("notification");
      expect(events).toContain("data.sync");
      expect(events).toHaveLength(3);
    });
  });

  describe("registerHandler", () => {
    it("should register a new handler", () => {
      const mockHandler = jest.fn();

      webhookService.registerHandler("custom.event", mockHandler);

      const events = webhookService.getRegisteredEvents();
      expect(events).toContain("custom.event");
    });

    it("should override existing handler", () => {
      const firstHandler = jest.fn();
      const secondHandler = jest.fn();

      webhookService.registerHandler("test", firstHandler);
      webhookService.registerHandler("test", secondHandler);

      const events = webhookService.getRegisteredEvents();
      expect(events.filter(e => e === "test")).toHaveLength(1);
    });
  });

  describe("handleWebhook", () => {
    it("should call registered handler with payload and request", async () => {
      const mockHandler = jest.fn();
      const mockPayload = { data: "test" };
      const mockReq = {} as Request;

      webhookService.registerHandler("test.event", mockHandler);

      await webhookService.handleWebhook("test.event", mockPayload, mockReq);

      expect(mockHandler).toHaveBeenCalledWith(mockPayload, mockReq);
      expect(mockHandler).toHaveBeenCalledTimes(1);
    });

    it("should throw error for unregistered event", async () => {
      const mockPayload = { data: "test" };
      const mockReq = {} as Request;

      await expect(
        webhookService.handleWebhook("unregistered.event", mockPayload, mockReq),
      ).rejects.toThrow("No handler registered for webhook event: unregistered.event");
    });

    it("should handle async handlers", async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const mockPayload = { data: "test" };
      const mockReq = {} as Request;

      webhookService.registerHandler("async.event", mockHandler);

      await webhookService.handleWebhook("async.event", mockPayload, mockReq);

      expect(mockHandler).toHaveBeenCalled();
    });

    it("should propagate errors from handlers", async () => {
      const error = new Error("Handler failed");
      const mockHandler = jest.fn().mockRejectedValue(error);
      const mockPayload = { data: "test" };
      const mockReq = {} as Request;

      webhookService.registerHandler("failing.event", mockHandler);

      await expect(
        webhookService.handleWebhook("failing.event", mockPayload, mockReq),
      ).rejects.toThrow("Handler failed");
    });
  });

  describe("getRegisteredEvents", () => {
    it("should return empty array when no handlers registered", () => {
      const events = webhookService.getRegisteredEvents();

      expect(events).toEqual([]);
    });

    it("should return all registered event names", () => {
      webhookService.registerHandler("event1", jest.fn());
      webhookService.registerHandler("event2", jest.fn());
      webhookService.registerHandler("event3", jest.fn());

      const events = webhookService.getRegisteredEvents();

      expect(events).toHaveLength(3);
      expect(events).toContain("event1");
      expect(events).toContain("event2");
      expect(events).toContain("event3");
    });
  });
});
