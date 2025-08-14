import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../utils/axios";

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
      if (location.pathname === "/callback") {
        setIsLoading(false);
        return;
      }

      if (hasCheckedSession.current) {
        setIsLoading(false);
        return;
      }

      try {
        const session = await api.get<{ user: any; employee: any }>(
          "/auth/session",
          undefined,
        );

        setUserState(session?.user ?? null);
        setEmployeeState(session?.employee ?? null);
        hasCheckedSession.current = true;
      } catch (error: any) {
        const status =
          error?.status ??
          error?.code ??
          error?.response?.status ??
          "unknown";
        console.log("Session check failed:", status);

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
