import { AxiosError } from "axios";
import { useState } from "react";

import { instance } from "@/utils";

const useSyncEmployees = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const syncEmployees = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const { data } = await instance.post("/employees/sync");

      if (data.success) {
        setSuccess(data.success);
      } else {
        setError(data.error || "Failed to sync employees");
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.message || "Failed to fetch employees");
      } else {
        setError("An error occurred. Please try again.");
      }
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { syncEmployees, loading, error, success };
};

export default useSyncEmployees;
