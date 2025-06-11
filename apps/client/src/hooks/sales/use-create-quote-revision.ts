import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

export const useCreateQuoteRevision = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createQuoteRevision = async (quoteId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.post(`/quotes/${quoteId}/revision`);
      setSuccess(true);
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "An error occurred while creating quote revision."
          : "An error occurred while creating quote revision.";

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
    createQuoteRevision,
  };
};
