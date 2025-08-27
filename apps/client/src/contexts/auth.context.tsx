import { env } from "@/config/env";
import axios from "axios";
import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";


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
  const [user, setUserState] = useState<any>(null);
  const [employee, setEmployeeState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedSession = useRef(false);

  const setUser = (user: any, employee: any) => {
    setUserState(user);
    setEmployeeState(employee);
    hasCheckedSession.current = true;
    setIsLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      if (location.pathname === "/login" || location.pathname === "/callback") {
        setIsLoading(false);
        return;
      }

      if (hasCheckedSession.current) {
        setIsLoading(false);
        return;
      }

      try {
        const { data } = await axios.get(`${env.VITE_API_URL}/auth/session`, {
          headers: {
            "Content-Type": "application/json",
          },
          withCredentials: true,
        });

        setUserState(data.user);
        setEmployeeState(data.employee);
        hasCheckedSession.current = true;
      } catch (error: any) {
        console.log("Session check failed:", error.response?.status);
        setUserState(null);
        setEmployeeState(null);
        hasCheckedSession.current = true;

        if (location.pathname !== "/login") {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();
  }, [location.pathname, navigate]);

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
