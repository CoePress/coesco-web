import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { api } from "@/hooks/use-api";

interface User {
  id: string;
  username: string;
  role: "ADMIN" | "USER";
  microsoftId?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ error: string | null }>;
  loginWithMicrosoft: () => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkSession = useCallback(async () => {
    try {
      const response = await api.get<{ userId: string }>("/auth/me");
      if (response.userId) {
        setUser({
          id: response.userId,
          username: "",
          role: "USER",
        });
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  const login = useCallback(async (username: string, password: string) => {
    try {
      await api.post("/auth/login", { username, password });
      await checkSession();
      return { error: null };
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Login failed" };
    }
  }, [checkSession]);

  const loginWithMicrosoft = useCallback(() => {
    const returnUrl = encodeURIComponent(window.location.origin);
    window.location.href = `http://localhost:8080/v1/auth/microsoft?returnUrl=${returnUrl}`;
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        loginWithMicrosoft,
        logout,
        checkSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
