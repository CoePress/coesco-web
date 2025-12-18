import { useState, useCallback } from "react";

const API_BASE_URL = "http://localhost:8080/v1";

interface ApiState<T> {
  data: T | null;
  error: string | null;
  isLoading: boolean;
}

interface ApiOptions {
  headers?: Record<string, string>;
}

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function request<T>(
  method: HttpMethod,
  endpoint: string,
  body?: unknown,
  options?: ApiOptions,
): Promise<T> {
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Request failed: ${response.status}`);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export function useApi<T = unknown>() {
  const [state, setState] = useState<ApiState<T>>({
    data: null,
    error: null,
    isLoading: false,
  });

  const execute = useCallback(
    async (method: HttpMethod, endpoint: string, body?: unknown, options?: ApiOptions) => {
      setState({ data: null, error: null, isLoading: true });

      try {
        const data = await request<T>(method, endpoint, body, options);
        setState({ data, error: null, isLoading: false });
        return { data, error: null };
      } catch (err) {
        const error = err instanceof Error ? err.message : "An error occurred";
        setState({ data: null, error, isLoading: false });
        return { data: null, error };
      }
    },
    [],
  );

  const get = useCallback(
    (endpoint: string, options?: ApiOptions) => execute("GET", endpoint, undefined, options),
    [execute],
  );

  const post = useCallback(
    (endpoint: string, body?: unknown, options?: ApiOptions) => execute("POST", endpoint, body, options),
    [execute],
  );

  const put = useCallback(
    (endpoint: string, body?: unknown, options?: ApiOptions) => execute("PUT", endpoint, body, options),
    [execute],
  );

  const patch = useCallback(
    (endpoint: string, body?: unknown, options?: ApiOptions) => execute("PATCH", endpoint, body, options),
    [execute],
  );

  const del = useCallback(
    (endpoint: string, options?: ApiOptions) => execute("DELETE", endpoint, undefined, options),
    [execute],
  );

  const reset = useCallback(() => {
    setState({ data: null, error: null, isLoading: false });
  }, []);

  return {
    ...state,
    get,
    post,
    put,
    patch,
    delete: del,
    reset,
  };
}

export const api = {
  get: <T>(endpoint: string, options?: ApiOptions) => request<T>("GET", endpoint, undefined, options),
  post: <T>(endpoint: string, body?: unknown, options?: ApiOptions) => request<T>("POST", endpoint, body, options),
  put: <T>(endpoint: string, body?: unknown, options?: ApiOptions) => request<T>("PUT", endpoint, body, options),
  patch: <T>(endpoint: string, body?: unknown, options?: ApiOptions) => request<T>("PATCH", endpoint, body, options),
  delete: <T>(endpoint: string, options?: ApiOptions) => request<T>("DELETE", endpoint, undefined, options),
};
