import axios, { AxiosError } from "axios";
import { useState } from "react";

import env from "@/config/env";

const useDeleteMachine = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const deleteMachine = async (machineId: string) => {
    setLoading(true);
    setError(null);

    try {
      await axios.delete(`${env.VITE_API_URL}/machines/${machineId}`, {
        withCredentials: true,
      });
      return true;
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
    loading,
    error,
    deleteMachine,
  };
};

export default useDeleteMachine;
