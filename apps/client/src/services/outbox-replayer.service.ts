import type { AxiosError } from "axios";

import type { OutboxRecord } from "@/types/outbox.types";

import { instance } from "@/hooks/use-api";
import { isOnline } from "@/utils/network";
import { calculateBackoff, dispatchOutboxEvent } from "@/utils/outbox.utils";

import { outboxService } from "./outbox.service";

class OutboxReplayerService {
  private isProcessing = false;
  private intervalId: number | null = null;
  private readonly BATCH_SIZE = 10;
  private readonly REPLAY_INTERVAL = 5000;

  start(): void {
    if (this.intervalId !== null)
      return;

    this.processQueue();

    this.intervalId = window.setInterval(() => {
      this.processQueue();
    }, this.REPLAY_INTERVAL);

    window.addEventListener("online", () => {
      console.log("[outbox] Network online, triggering replay");
      this.processQueue();
    });
  }

  stop(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  async processQueue(): Promise<void> {
    if (this.isProcessing || !isOnline())
      return;

    this.isProcessing = true;

    try {
      const records = await outboxService.getReady(this.BATCH_SIZE);

      if (records.length === 0) {
        this.isProcessing = false;
        return;
      }

      console.log(`[outbox] Processing ${records.length} queued requests`);

      for (const record of records) {
        await this.processRecord(record);
      }
    }
    catch (error) {
      console.error("[outbox] Error processing queue:", error);
    }
    finally {
      this.isProcessing = false;
    }
  }

  private async processRecord(record: OutboxRecord): Promise<void> {
    try {
      console.log(`[outbox] Replaying ${record.method} ${record.url} (attempt ${record.attempts + 1}/${record.maxAttempts})`);

      const config = {
        ...record.config,
        headers: {
          ...record.config?.headers,
          "Idempotency-Key": record.idempotencyKey,
        },
      };

      let response;
      switch (record.method) {
        case "POST":
          response = await instance.post(record.url, record.data, config);
          break;
        case "PATCH":
          response = await instance.patch(record.url, record.data, config);
          break;
        case "PUT":
          response = await instance.put(record.url, record.data, config);
          break;
        case "DELETE":
          response = await instance.delete(record.url, config);
          break;
      }

      console.log(`[outbox] Success: ${record.method} ${record.url}`);
      await outboxService.remove(record.id);

      dispatchOutboxEvent("flushed", {
        id: record.id,
        method: record.method,
        url: record.url,
        response: response.data,
      });
    }
    catch (error) {
      await this.handleError(record, error);
    }
  }

  private async handleError(record: OutboxRecord, error: unknown): Promise<void> {
    const axiosError = error as AxiosError;
    const statusCode = axiosError.response?.status;

    if (statusCode && statusCode >= 400 && statusCode < 500) {
      console.error(`[outbox] Hard failure (${statusCode}): ${record.method} ${record.url}`);
      await outboxService.remove(record.id);

      dispatchOutboxEvent("failed", {
        id: record.id,
        method: record.method,
        url: record.url,
        error: axiosError.response?.data?.message || "Client error",
        statusCode,
      });
      return;
    }

    record.attempts += 1;
    record.lastError = axiosError.response?.data?.message || axiosError.message || "Unknown error";

    if (record.attempts >= record.maxAttempts) {
      console.error(`[outbox] Max attempts reached: ${record.method} ${record.url}`);
      await outboxService.remove(record.id);

      dispatchOutboxEvent("failed", {
        id: record.id,
        method: record.method,
        url: record.url,
        error: record.lastError,
        maxAttemptsReached: true,
      });
      return;
    }

    const backoffDelay = calculateBackoff(record.attempts);
    record.nextAttemptAt = Date.now() + backoffDelay;

    console.log(`[outbox] Retry scheduled for ${record.method} ${record.url} in ${Math.round(backoffDelay / 1000)}s (attempt ${record.attempts}/${record.maxAttempts})`);
    await outboxService.update(record);
  }
}

export const outboxReplayerService = new OutboxReplayerService();
