import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { instance } from "@/utils";

interface ISettings {
  [key: string]: {
    [key: string]: string;
  };
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
        const { data } = await instance.get(`/settings/${moduleSlug}`);

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
