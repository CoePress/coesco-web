import { instance } from "@/utils";
import { AxiosError } from "axios";
import { useState } from "react";

interface CreateQuoteParams {
  customerId?: string;
  journeyId?: string;
  customerName?: string;
  journeyName?: string;
}

export const useCreateQuote = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const createQuote = async (params?: CreateQuoteParams) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    console.log("Creating quote with params:", params);
    console.log("Params type:", typeof params);
    console.log("Params keys:", Object.keys(params || {}));
    console.log("Params values:", Object.values(params || {}));

    try {
      const response = await instance.post("/quotes", params);
      console.log("Quote creation response:", response.data);
      setSuccess(true);
      return response.data;
    } catch (error) {
      console.error("Quote creation error:", error);
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
    createQuote,
  };
};
