import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

const useGetSystemStatus = (
  options = {
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  }
) => {
  const [status, setStatus] = useState<"good" | "bad" | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<string | null>(null);

  const getStatus = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${env.VITE_API_URL}/health`, {
        headers: {
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (response.data.status === "ok") {
        setStatus("good");
        setLastChecked(response.data.timestamp);
      } else {
        setStatus("bad");
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

  useEffect(() => {
    if (options.enabled) {
      getStatus();
    }
  }, [options.enabled]);

  return {
    status,
    loading,
    error,
    lastChecked,
    refetch: getStatus,
  };
};

export default useGetSystemStatus;
