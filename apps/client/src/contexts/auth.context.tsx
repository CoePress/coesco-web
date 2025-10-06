import {
  createContext,
  useState,
  useEffect,
  ReactNode,
  useContext,
  useRef,
} from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useApi } from "@/hooks/use-api";

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

const PUBLIC_ROUTES = new Set(["/login", "/callback", "/forgot-password"]);

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUserState] = useState<any>(null);
  const [employee, setEmployeeState] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const hasCheckedSession = useRef(false);
  const { get } = useApi<{ user: any; employee: any }>();

  const setUser = (user: any, employee: any) => {
    setUserState(user);
    setEmployeeState(employee);
    hasCheckedSession.current = true;
    setIsLoading(false);
  };

  useEffect(() => {
    const checkSession = async () => {
      if (PUBLIC_ROUTES.has(location.pathname)) {
        setIsLoading(false);
        return;
      }

      if (hasCheckedSession.current) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await get("/auth/session");

        if (response) {
          setUserState(response.user);
          setEmployeeState(response.employee);
        } else {
          throw new Error("Session check failed");
        }
        hasCheckedSession.current = true;
      } catch (error: any) {
        setUserState(null);
        setEmployeeState(null);
        hasCheckedSession.current = true;

        if (!PUBLIC_ROUTES.has(location.pathname)) {
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
