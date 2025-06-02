import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

export const useCreateSandboxQuote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createSandboxQuote = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await instance.post("/sales/sandbox");
      setSuccess(true);
      return response.data;
    } catch (error) {
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
    createSandboxQuote,
  };
};
