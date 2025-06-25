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
  const [user, setUserState] = useState<any>(null);
  const [employee, setEmployeeState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const sessionCheckDone = useRef(false);

  const setUser = (user: any, employee: any) => {
    setUserState(user);
    setEmployeeState(employee);
    sessionCheckDone.current = true;
    setIsLoading(false);
  };

  useEffect(() => {
    const checkUser = async () => {
      // Skip session check only for login page, auth routes, or if we already confirmed the session
      if (
        location.pathname === "/login" ||
        location.pathname.includes("/auth/") ||
        (sessionCheckDone.current && user && employee)
      ) {
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
        sessionCheckDone.current = true;
      } catch (error: any) {
        console.log("Session check failed:", error.response?.status);
        setUserState(null);
        setEmployeeState(null);
        sessionCheckDone.current = false;

        // Redirect to login if session is invalid
        if (location.pathname !== "/login") {
          navigate("/login");
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
  }, [location.pathname, navigate, user, employee]);

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
