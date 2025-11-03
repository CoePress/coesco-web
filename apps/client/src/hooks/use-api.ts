import type { AxiosRequestConfig } from "axios";

import axios, { AxiosError } from "axios";
import { useState } from "react";

import type { OutboxMethod, QueueConfig, QueuedResponse } from "@/types/outbox.types";
import type { IQueryParams } from "@/utils/types";

import { __outboxEnabled__, env } from "@/config/env";
import { outboxService } from "@/services/outbox.service";
import { shouldQueue } from "@/utils/network";
import { generateIdempotencyKey, sanitizeConfig } from "@/utils/outbox.utils";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

interface ExtendedAxiosConfig extends AxiosRequestConfig {
  queue?: QueueConfig;
}

export const instance = axios.create({
  baseURL: env.VITE_API_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export function useApi<T = any>() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [response, setResponse] = useState<T | null>(null);

  const request = async (
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: ExtendedAxiosConfig,
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const queueConfig = config?.queue;
      const needsQueue = __outboxEnabled__
        && !queueConfig?.skipQueue
        && (queueConfig?.forceQueue || shouldQueue(method));

      if (needsQueue && method !== "GET") {
        const idempotencyKey = queueConfig?.idempotencyKey || generateIdempotencyKey();
        const maxAttempts = queueConfig?.maxAttempts || 5;

        const record = {
          id: generateIdempotencyKey(),
          method: method as OutboxMethod,
          url: endpoint,
          data,
          config: sanitizeConfig(config),
          idempotencyKey,
          attempts: 0,
          maxAttempts,
          createdAt: Date.now(),
          nextAttemptAt: Date.now(),
        };

        await outboxService.add(record);

        console.log(`[outbox] Queued ${method} ${endpoint}`);

        const queuedResponse: QueuedResponse = {
          queued: true,
          id: record.id,
          idempotencyKey,
        };

        setLoading(false);
        return queuedResponse as T;
      }

      const finalConfig = {
        ...config,
        headers: {
          ...config?.headers,
        },
      };

      if (__outboxEnabled__ && method !== "GET") {
        const idempotencyKey = queueConfig?.idempotencyKey || generateIdempotencyKey();
        finalConfig.headers = {
          ...finalConfig.headers,
          "Idempotency-Key": idempotencyKey,
        };
      }

      let response;

      switch (method) {
        case "GET":
          response = await instance.get<T>(endpoint, finalConfig);
          break;
        case "POST":
          response = await instance.post<T>(endpoint, data, finalConfig);
          break;
        case "PATCH":
          response = await instance.patch<T>(endpoint, data, finalConfig);
          break;
        case "PUT":
          response = await instance.put<T>(endpoint, data, finalConfig);
          break;
        case "DELETE":
          response = await instance.delete<T>(endpoint, finalConfig);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setSuccess(true);
      setResponse(response.data);
      return response.data;
    }
    catch (error) {
      const errorMessage
        = error instanceof AxiosError
          ? error.response?.data?.message
          || "An error occurred. Please try again."
          : "An error occurred. Please try again.";

      setError(errorMessage);
      setResponse(null);
      return null;
    }
    finally {
      setLoading(false);
    }
  };

  const get = (
    endpoint: string,
    params?: IQueryParams<T> | Record<string, any>,
    config?: ExtendedAxiosConfig,
  ) => {
    let queryParams = {};

    if (params) {
      queryParams = { ...params };
      if ("include" in queryParams && queryParams.include && typeof queryParams.include !== "string") {
        queryParams.include = JSON.stringify(queryParams.include);
      }
    }

    const finalConfig = {
      ...config,
      params: queryParams,
    };

    return request("GET", endpoint, undefined, finalConfig);
  };

  const post = (endpoint: string, data?: any, config?: ExtendedAxiosConfig) =>
    request("POST", endpoint, data, config);

  const patch = (endpoint: string, data?: any, config?: ExtendedAxiosConfig) =>
    request("PATCH", endpoint, data, config);

  const put = (endpoint: string, data?: any, config?: ExtendedAxiosConfig) =>
    request("PUT", endpoint, data, config);

  const del = (endpoint: string, config?: ExtendedAxiosConfig) =>
    request("DELETE", endpoint, undefined, config);

  return {
    loading,
    error,
    success,
    response,
    request,
    get,
    post,
    patch,
    put,
    delete: del,
  };
}
