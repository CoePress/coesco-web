import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { instance } from "@/utils";
import { IApiResponse, IMachineOverview } from "@/utils/types";

export interface UseGetOverviewProps {
  startDate?: string;
  endDate?: string;
  view?: string;
  filter?: string;
}

const useGetOverview = ({
  startDate,
  endDate,
  view,
  filter,
}: UseGetOverviewProps = {}) => {
  const [overview, setOverview] = useState<IMachineOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string> = {};
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
        if (view) params.view = view;
        if (filter) params.filter = filter;

        const { data } = await instance.get<IApiResponse<IMachineOverview>>(
          `/production/overview`,
          {
            params,
          }
        );

        if (data.success) {
          setOverview(data.data || null);
        } else {
          setError(data.error || "Failed to fetch overview");
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

    getOverview();
  }, [refreshToggle, startDate, endDate, view, filter]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    overview,
    loading,
    error,
    refresh,
  };
};

export default useGetOverview;
