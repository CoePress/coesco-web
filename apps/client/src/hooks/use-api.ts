import type { AxiosRequestConfig } from "axios";

import axios, { AxiosError } from "axios";
import { useState } from "react";

import type { IQueryParams } from "@/utils/types";

import { env } from "@/config/env";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

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
    config?: AxiosRequestConfig,
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let response;

      switch (method) {
        case "GET":
          response = await instance.get<T>(endpoint, config);
          break;
        case "POST":
          response = await instance.post<T>(endpoint, data, config);
          break;
        case "PATCH":
          response = await instance.patch<T>(endpoint, data, config);
          break;
        case "PUT":
          response = await instance.put<T>(endpoint, data, config);
          break;
        case "DELETE":
          response = await instance.delete<T>(endpoint, config);
          break;
        default:
          throw new Error(`Unsupported HTTP method: ${method}`);
      }

      setSuccess(true);
      setResponse(response.data);
      return response.data;
    }
    catch (error) {
      console.error(`API request error for ${method} ${endpoint}:`, error);
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
    config?: AxiosRequestConfig,
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

  const post = (endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request("POST", endpoint, data, config);

  const patch = (endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request("PATCH", endpoint, data, config);

  const put = (endpoint: string, data?: any, config?: AxiosRequestConfig) =>
    request("PUT", endpoint, data, config);

  const del = (endpoint: string, config?: AxiosRequestConfig) =>
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
