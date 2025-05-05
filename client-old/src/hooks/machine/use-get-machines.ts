import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IMachine } from "@machining/types";

const useGetMachines = () => {
  const [machines, setMachines] = useState<IMachine[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getMachines = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(`${env.VITE_API_URL}/machines`, {
          withCredentials: true,
        });

        setMachines(data);
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

    getMachines();
  }, [refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    machines,
    loading,
    error,
    refresh,
  };
};

export default useGetMachines;
