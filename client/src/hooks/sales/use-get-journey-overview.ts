import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

const useGetJourneyOverview = ({ journeyId }: { journeyId: string }) => {
  const [journeyOverview, setJourneyOverview] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getJourneyOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any>>(
          `/journeys/${journeyId}/overview`
        );

        if (data.success) {
          setJourneyOverview(data.data);
        } else {
          setError(data.error || "Failed to fetch journey overview");
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

    getJourneyOverview();
  }, [refreshToggle, journeyId]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    journeyOverview,
    loading,
    error,
    refresh,
  };
};

export default useGetJourneyOverview;
