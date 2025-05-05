import axios, { AxiosError } from "axios";
import { useState } from "react";

import env from "@/config/env";
import { IMachine } from "@machining/types";

const useUpdateMachine = () => {
  const [updatedMachine, setUpdatedMachine] = useState<IMachine | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateMachine = async (
    machineId: string,
    machineData: Partial<IMachine>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.patch(
        `${env.VITE_API_URL}/machines/${machineId}`,
        machineData,
        {
          withCredentials: true,
        }
      );

      setUpdatedMachine(data);
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
    updatedMachine,
    loading,
    error,
    updateMachine,
  };
};

export default useUpdateMachine;
