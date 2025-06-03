import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

const useGetQuoteOverview = ({ quoteId }: { quoteId: string }) => {
  const [quoteOverview, setQuoteOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getQuoteOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any>>(
          `/quotes/${quoteId}/overview`
        );

        if (data.success) {
          setQuoteOverview(data.data);
        } else {
          setError(data.error || "Failed to fetch quote overview");
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
        return null;
      } finally {
        setLoading(false);
      }
    };

    getQuoteOverview();
  }, [refreshToggle, quoteId]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    quoteOverview,
    loading,
    error,
    refresh,
  };
};

export default useGetQuoteOverview;
