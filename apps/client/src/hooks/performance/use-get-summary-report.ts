import { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { instance } from "@/utils";
import { IApiResponse } from "@/utils/types";
import { PerformanceData } from "@/contexts/performance.context";
import { ISummaryReportData, mapPerformanceToSummary } from "@/utils/summary-report-utils";

export const useGetSummaryReport = (
  endpoint: string,
  id?: string | number
) => {
  const [summary, setSummary] = useState<ISummaryReportData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getSummary = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<PerformanceData>>(
          `${endpoint}/${id}`
        );

        if (data.success && data.data) {
          setSummary(mapPerformanceToSummary(data.data));
        } else {
          setError(data.error || `Failed to fetch summary report from ${endpoint}`);
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

    getSummary();
  }, [endpoint, id, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    summary,
    loading,
    error,
    refresh,
  };
};