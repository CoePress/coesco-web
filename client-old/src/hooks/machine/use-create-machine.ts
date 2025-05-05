import axios, { AxiosError } from "axios";
import { useState } from "react";

import env from "@/config/env";
import { IMachine } from "@machining/types";

const useCreateMachine = () => {
  const [machine, setMachine] = useState<IMachine | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createMachine = async (machineData: any) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.post(
        `${env.VITE_API_URL}/machines`,
        machineData,
        {
          withCredentials: true,
        }
      );

      setMachine(data);
      return data;
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

  return {
    machine,
    loading,
    error,
    createMachine,
  };
};

export default useCreateMachine;
