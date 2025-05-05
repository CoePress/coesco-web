import axios, { AxiosError } from "axios";
import { useEffect, useRef, useState } from "react";

import env from "@/config/env";
import { decompressTimelineData } from "@/lib/utils";

interface QueryParams {
  machineId: string;
  startDate?: Date;
  endDate?: Date;
  enabled?: boolean;
}

interface DateParams {
  startDate?: Date;
  endDate?: Date;
}

const useGetTimeline = (params: QueryParams) => {
  const [timeline, setTimeline] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previousDates = useRef<DateParams | undefined>(params);
  const isInitialMount = useRef(true);

  const formatDateToString = (date?: Date) => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (params.enabled === false) {
      setLoading(false);
      setTimeline(null);
      setError(null);
      return;
    }

    if (!isInitialMount.current) {
      const datesChanged =
        previousDates.current?.startDate?.getTime() !==
          params?.startDate?.getTime() ||
        previousDates.current?.endDate?.getTime() !==
          params?.endDate?.getTime();

      if (!datesChanged) return;
    }

    isInitialMount.current = false;
    previousDates.current = params;

    const getTimeline = async () => {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams();
        const startDate = formatDateToString(params?.startDate);
        const endDate = formatDateToString(params?.endDate);

        if (startDate) urlParams.append("startDate", startDate);
        if (endDate) urlParams.append("endDate", endDate);

        const url = `${env.VITE_API_URL}/analytics/timeline/${params.machineId}${
          urlParams.toString() ? `?${urlParams.toString()}` : ""
        }`;

        const { data } = await axios.get(url, { withCredentials: true });
        const decompressedData = decompressTimelineData(data);
        setTimeline(decompressedData);
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
  }, [params?.startDate, params?.endDate, params.machineId, params.enabled]);

  return { timeline, loading, error };
};

export default useGetTimeline;
