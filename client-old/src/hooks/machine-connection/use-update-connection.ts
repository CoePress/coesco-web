import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IMachineConnection } from "@machining/types";

const useUpdateMachineConnection = (machineId: string) => {
  const [machineConnection, setMachineConnection] =
    useState<IMachineConnection | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMachineConnection = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await axios.get<IMachineConnection>(
          `${env.VITE_API_URL}/machine-connections/${machineId}`
        );
        setMachineConnection(response.data);
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

    fetchMachineConnection();
  }, [machineId]);

  return { machineConnection, loading, error };
};

export default useUpdateMachineConnection;
