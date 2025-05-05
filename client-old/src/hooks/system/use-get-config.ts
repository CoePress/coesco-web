import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

interface Config {
  [key: string]: any;
}

const useGetConfig = (
  options = {
    enabled: true,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  }
) => {
  const [config, setConfig] = useState<Config | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axios.get(`${env.VITE_API_URL}/config`, {
        withCredentials: true,
      });

      setConfig(response.data);
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.error || error.message);
      } else {
        setError("An error occurred while fetching configuration.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (options.enabled) {
      fetchConfig();
    }
  }, [options.enabled]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
  };
};

export default useGetConfig;
