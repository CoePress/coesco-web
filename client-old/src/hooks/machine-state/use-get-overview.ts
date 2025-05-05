import axios, { AxiosError } from "axios";
import { useEffect, useState, useRef } from "react";

import env from "@/config/env";
import { IOverviewResponse } from "@machining/types";

interface DateParams {
  startDate?: Date;
  endDate?: Date;
}

const useGetMachineOverview = (params?: DateParams) => {
  const [overview, setOverview] = useState<IOverviewResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const previousDates = useRef<DateParams | undefined>(params);
  const isInitialMount = useRef(true);

  const formatDateToString = (date?: Date) => {
    if (!date) return undefined;
    return date.toISOString().split("T")[0];
  };

  useEffect(() => {
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

    const getMachineOverview = async () => {
      setLoading(true);
      setError(null);

      try {
        const urlParams = new URLSearchParams();

        const startDate = formatDateToString(params?.startDate);
        const endDate = formatDateToString(params?.endDate);

        if (startDate) {
          urlParams.append("startDate", startDate);
        }

        if (endDate) {
          urlParams.append("endDate", endDate);
        }

        const url = `${env.VITE_API_URL}/analytics/overview${urlParams.toString() ? `?${urlParams.toString()}` : ""}`;

        const { data } = await axios.get(url, {
          withCredentials: true,
        });

        setOverview(data);
        console.log(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
        setOverview(null);
      } finally {
        setLoading(false);
      }
    };

    getMachineOverview();
  }, [params?.startDate, params?.endDate]);

  return {
    overview,
    loading,
    error,
  };
};

export default useGetMachineOverview;
