import { AxiosError } from "axios";
import { useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

export const useDeleteEntity = <T = any>(endpoint: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const deleteEntity = async (id: string | number) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.delete<IApiResponse<T>>(
        `${endpoint}/${id}`
      );

      if (response.data.success) {
        setSuccess(true);
        return response.data;
      } else {
        setError(
          response.data.error || `Failed to delete entity at ${endpoint}`
        );
        return null;
      }
    } catch (error) {
      console.error(`Entity deletion error for ${endpoint}:`, error);
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
    deleteEntity,
  };
};
