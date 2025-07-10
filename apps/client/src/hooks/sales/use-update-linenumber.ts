import { AxiosError } from "axios";
import { useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

export const useUpdateLineNumber = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const updateLineNumber = async (itemId: string, lineNumber: number) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.patch<IApiResponse<any>>(
        `/quotes/items/${itemId}/line-number`,
        { lineNumber }
      );

      if (response.data.success) {
        setSuccess(true);
        return response.data.data;
      } else {
        setError(response.data.error || "Failed to update line number");
        return null;
      }
    } catch (error) {
      console.error("Line number update error:", error);
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
    updateLineNumber,
  };
};
