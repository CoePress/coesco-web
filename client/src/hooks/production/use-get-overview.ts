import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

export interface IStateOverview {
  kpis: {
    [key: string]: {
      value: number;
      change: number;
    };
  };
  utilization: {
    label: string;
    start: Date;
    end: Date;
    utilization: number;
  }[];
  states: {
    label: string;
    duration: number;
    percentage: number;
  }[];
  machines: {
    id: string;
    name: string;
  }[];
  alarms: {
    id: string;
    machineId: string;
    timestamp: Date;
    type: string;
    severity: string;
    message?: string;
  }[];
}

interface UseGetOverviewProps {
  startDate?: string;
  endDate?: string;
}

const useGetOverview = ({ startDate, endDate }: UseGetOverviewProps = {}) => {
  const [overview, setOverview] = useState<IStateOverview | null>(null);
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

        const { data } = await axios.get(
          `${env.VITE_API_URL}/states/overview`,
          {
            params,
            withCredentials: true,
          }
        );

        setOverview(data);
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
  }, [refreshToggle, startDate, endDate]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    overview,
    loading,
    error,
    refresh,
  };
};

export default useGetOverview;
