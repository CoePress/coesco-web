import axios, { AxiosError } from "axios";
import { useState, useContext } from "react";

import env from "@/config/env";
import { AuthContext } from "@/contexts/auth.context";

const useLogout = () => {
  const { setUser } = useContext(AuthContext)!;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await axios.post(
        `${env.VITE_API_URL}/auth/logout`,
        {},
        {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      setUser(null);
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

  return { logout, loading, error };
};

export default useLogout;
