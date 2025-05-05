import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IMachineState } from "@machining/types";

const useGetStates = ({
  machineId,
  startedAt,
  endedAt,
  page = 1,
  limit = 50,
}: any) => {
  const [states, setStates] = useState<IMachineState[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getStates = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (machineId) params.append("machineId", machineId);
        if (startedAt)
          params.append("startedAt", startedAt.toISOString().split("T")[0]);
        if (endedAt)
          params.append("endedAt", endedAt.toISOString().split("T")[0]);
        params.append("page", page.toString());
        params.append("limit", limit.toString());

        const { data } = await axios.get(
          `${env.VITE_API_URL}/states?${params}`,
          {
            withCredentials: true,
          }
        );

        setStates(data);
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

    getStates();
  }, [machineId, startedAt, endedAt, page, limit]);

  return { states, loading, error };
};

export default useGetStates;
