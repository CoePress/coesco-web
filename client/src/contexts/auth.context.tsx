import axios from "axios";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
} from "react";

import env from "@/config/env";

interface IAuthContextType {
  user: any;
  employee: any;
  setUser: (user: any, employee: any) => void;
  isLoading: boolean;
}

export const AuthContext = createContext<IAuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<any>(null);
  const [employee, setEmployee] = useState<any>(null);
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
        setEmployee(data.employee);
      } catch (error) {
        setUser(null);
        setEmployee(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, employee, setUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
