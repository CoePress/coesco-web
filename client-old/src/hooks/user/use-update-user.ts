import axios, { AxiosError } from "axios";
import { useState } from "react";

import env from "@/config/env";
import { IUser } from "@machining/types";

const useUpdateUser = () => {
  const [updatedUser, setUpdatedUser] = useState<IUser | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (userId: string, userData: Partial<IUser>) => {
    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.patch(
        `${env.VITE_API_URL}/users/${userId}`,
        userData,
        {
          withCredentials: true,
        }
      );

      setUpdatedUser(data);
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
    updatedUser,
    loading,
    error,
    updateUser,
  };
};

export default useUpdateUser;
