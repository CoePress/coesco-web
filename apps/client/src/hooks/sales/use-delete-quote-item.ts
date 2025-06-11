import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

export const useDeleteQuoteItem = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const deleteQuoteItem = async (quoteItemId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.delete(`/quotes/items/${quoteItemId}`);
      setSuccess(true);
      return response.data;
    } catch (error) {
      const errorMessage =
        error instanceof AxiosError
          ? error.response?.data?.message ||
            "An error occurred while deleting item from quote."
          : "An error occurred while deleting item from quote.";

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
    deleteQuoteItem,
  };
};
