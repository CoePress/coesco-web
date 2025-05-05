import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";

import env from "@/config/env";
import { IUser } from "@machining/types";

const useGetUsers = () => {
  const [users, setUsers] = useState<IUser[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const getUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await axios.get(`${env.VITE_API_URL}/users`, {
          withCredentials: true,
        });

        setUsers(data);
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

    getUsers();
  }, [refreshToggle]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    users,
    loading,
    error,
    refresh,
  };
};

export default useGetUsers;
