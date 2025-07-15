import { AxiosError, AxiosRequestConfig } from "axios";
import { useState } from "react";
import { instance } from "@/utils";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export const useApi = <T = any>() => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const request = async (
    method: HttpMethod,
    endpoint: string,
    data?: any,
    config?: AxiosRequestConfig
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
      return response.data;
    } catch (error) {
      console.error(`API request error for ${method} ${endpoint}:`, error);
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "An error occurred. Please try again."
          : "An error occurred. Please try again.";

      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Convenience methods
  const get = (endpoint: string, config?: AxiosRequestConfig) =>
    request("GET", endpoint, undefined, config);

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
    request,
    get,
    post,
    patch,
    put,
    delete: del,
  };
};
