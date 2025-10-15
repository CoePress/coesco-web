import { useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/socket.context";
import { AuthContext } from "@/contexts/auth.context";
import { useToast } from "./use-toast";

export const useSessionMonitor = () => {
  const { onSessionRevoked } = useSocket();
  const { setUser } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSessionRevoked = useCallback((data: any) => {
    const { reason } = data;

    setUser(null, null);

    showToast({
      variant: "error",
      title: "Session Revoked",
      description: reason || "Your session has been revoked. Please log in again.",
    });

    navigate("/login");
  }, [setUser, showToast, navigate]);

  useEffect(() => {
    const cleanup = onSessionRevoked(handleSessionRevoked);
    return cleanup;
  }, [onSessionRevoked, handleSessionRevoked]);
};
