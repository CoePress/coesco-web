import { AxiosError } from "axios";
import { useState, useContext } from "react";

import { AuthContext } from "@/contexts/auth.context";
import { instance } from "@/utils";

const useLogout = () => {
  const { setUser } = useContext(AuthContext)!;
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const logout = async () => {
    setLoading(true);
    setError(null);

    try {
      await instance.post(`/auth/logout`);

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
