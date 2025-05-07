import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IStateTimeline } from "@/utils/t";

const useGetTimeline = ({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) => {
  const [timeline, setTimeline] = useState<IStateTimeline[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getTimeline = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;

        const { data } = await axios.get(
          `${env.VITE_API_URL}/states/timeline`,
          {
            params,
            withCredentials: true,
          }
        );

        setTimeline(data);
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

    getTimeline();
  }, [refreshToggle, startDate, endDate]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    timeline,
    loading,
    error,
    refresh,
  };
};

export default useGetTimeline;
