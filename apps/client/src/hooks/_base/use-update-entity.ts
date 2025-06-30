import { AxiosError } from "axios";
import { useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

export const useUpdateEntity = <T = any>(endpoint: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const updateEntity = async (id: string | number, params?: Partial<T>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.put<IApiResponse<T>>(
        `${endpoint}/${id}`,
        params
      );

      if (response.data.success) {
        setSuccess(true);
        return response.data.data;
      } else {
        setError(
          response.data.error || `Failed to update entity at ${endpoint}`
        );
        return null;
      }
    } catch (error) {
      console.error(`Entity update error for ${endpoint}:`, error);
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

  return {
    loading,
    error,
    success,
    updateEntity,
  };
};
