import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse } from "@/utils/types";
import { instance } from "@/utils";

export const useGetEntity = <T = any>(
  endpoint: string,
  id?: string | number
) => {
  const [entity, setEntity] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getEntity = async () => {
      if (!id) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<T>>(
          `${endpoint}/${id}`
        );

        if (data.success) {
          setEntity(data.data || null);
        } else {
          setError(data.error || `Failed to fetch entity from ${endpoint}`);
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

    getEntity();
  }, [endpoint, id, refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    entity,
    loading,
    error,
    refresh,
  };
};
