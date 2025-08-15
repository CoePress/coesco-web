import { AxiosError } from "axios";
import { useState } from "react";

import { instance } from "@/utils";

const useLogin = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const login = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await instance.get(`/auth/microsoft/login`);

      window.location.href = data.url;
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

  return { login, loading, error };
};

export default useLogin;
