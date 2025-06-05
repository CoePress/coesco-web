import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

interface CreateQuoteItemParams {
  itemId: string;
  quantity?: number;
}

export const useCreateQuoteItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createQuoteItem = async (
    quoteId: string,
    params: CreateQuoteItemParams
  ) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.post(`/quotes/${quoteId}/items`, params);
      setSuccess(true);
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "An error occurred while adding item to quote."
          : "An error occurred while adding item to quote.";

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
    createQuoteItem,
  };
};
