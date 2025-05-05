import axios, { AxiosError } from "axios";
import { useCallback, useState } from "react";

import env from "@/config/env";

const useSyncUsers = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const syncUsers = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(`${env.VITE_API_URL}/users/sync`, {
        withCredentials: true,
      });
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
  }, []);

  return { syncUsers, loading, error };
};

export default useSyncUsers;
