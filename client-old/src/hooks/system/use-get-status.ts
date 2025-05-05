import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

const useGetSystemHealth = (
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

  const fetchHealth = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${env.VITE_API_URL}/system/status`, {
        withCredentials: true,
      });

      if (response.status >= 200) {
        setStatus("good");
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
      fetchHealth();
    }
  }, [options.enabled]);

  return {
    status,
    loading,
    error,
    refetch: fetchHealth,
  };
};

export default useGetSystemHealth;
