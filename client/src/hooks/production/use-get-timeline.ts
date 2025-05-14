import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { instance } from "@/utils";
import { IApiResponse, IMachineTimeline } from "@/utils/types";

const useGetTimeline = ({
  startDate,
  endDate,
}: {
  startDate?: string;
  endDate?: string;
}) => {
  const [timeline, setTimeline] = useState<IMachineTimeline | null>(null);
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

        const { data } = await instance.get<IApiResponse<IMachineTimeline>>(
          `/machines/data/timeline`,
          {
            params,
          }
        );

        if (data.success) {
          setTimeline(data.data || null);
        } else {
          setError(data.error || "Failed to fetch timeline");
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
