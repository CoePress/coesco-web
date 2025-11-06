import type { AxiosRequestConfig } from "axios";

import type { SerializableAxiosConfig } from "@/types/outbox.types";

export function generateIdempotencyKey(): string {
  return crypto.randomUUID();
}

export function sanitizeConfig(config?: AxiosRequestConfig): SerializableAxiosConfig | undefined {
  if (!config)
    return undefined;

  const sanitized: SerializableAxiosConfig = {};

  if (config.headers) {
    sanitized.headers = {};
    for (const [key, value] of Object.entries(config.headers)) {
      if (typeof value === "string") {
        sanitized.headers[key] = value;
      }
    }
  }

  if (config.params) {
    sanitized.params = { ...config.params };
  }

  if (config.timeout) {
    sanitized.timeout = config.timeout;
  }

  return sanitized;
}

export function calculateBackoff(attempts: number): number {
  const baseDelay = 2000;
  const maxDelay = 60000;
  const jitter = Math.random() * 1000;

  const delay = Math.min(baseDelay * 2 ** attempts, maxDelay);
  return delay + jitter;
}

export function dispatchOutboxEvent(type: "flushed" | "failed", detail: any): void {
  const event = new CustomEvent(`outbox:${type}`, { detail });
  window.dispatchEvent(event);
}
