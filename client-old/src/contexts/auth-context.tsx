import { createContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import env from "@/config/env";
import { IUser } from "@machining/types";

interface IAuthContextType {
  user: IUser | null;
  setUser: (user: IUser | null) => void;
  isLoading: boolean;
}

const AuthContext = createContext<IAuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<IUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data } = await axios.get(`${env.VITE_API_URL}/auth/session`, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setUser(data.user);
      } catch (error) {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
