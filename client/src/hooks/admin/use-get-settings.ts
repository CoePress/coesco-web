import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";

// You can adjust this interface based on your settings structure
export interface ISettings {
  id: string;
  moduleSlug: string;
  settings: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const useGetSettings = (moduleSlug: string) => {
  const [settings, setSettings] = useState<ISettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getSettings = async () => {
      if (!moduleSlug) {
        setError("Module slug is required");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(
          `${env.VITE_API_URL}/settings/${moduleSlug}`,
          {
            withCredentials: true,
          }
        );

        setSettings(data);
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    getSettings();
  }, [moduleSlug, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    settings,
    loading,
    error,
    refresh,
  };
};

export default useGetSettings;
