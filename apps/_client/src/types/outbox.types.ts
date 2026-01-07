export type OutboxMethod = "POST" | "PATCH" | "PUT" | "DELETE";

export interface OutboxRecord {
  id: string;
  method: OutboxMethod;
  url: string;
  data?: any;
  config?: SerializableAxiosConfig;
  idempotencyKey: string;
  attempts: number;
  maxAttempts: number;
  createdAt: number;
  nextAttemptAt: number;
  lastError?: string;
}

export interface SerializableAxiosConfig {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  timeout?: number;
}

export interface QueueConfig {
  forceQueue?: boolean;
  skipQueue?: boolean;
  maxAttempts?: number;
  idempotencyKey?: string;
}

export interface QueuedResponse {
  queued: true;
  id: string;
  idempotencyKey: string;
}

export interface OutboxStats {
  queued_count: number;
  flushed_count: number;
  failed_count: number;
}
