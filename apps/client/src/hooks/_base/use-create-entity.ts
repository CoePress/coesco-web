import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

export const useCreateEntity = <T = any>(endpoint: string) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createEntity = async (params?: T) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.post(endpoint, params);
      setSuccess(true);
      return response.data;
    } catch (error) {
      console.error(`Entity creation error for ${endpoint}:`, error);
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
    createEntity,
  };
};
