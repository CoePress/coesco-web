import { useEffect, useContext, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/socket.context";
import { AuthContext } from "@/contexts/auth.context";
import { useToast } from "./use-toast";

export const useSessionMonitor = () => {
  const { onSessionRevoked } = useSocket();
  const { setUser, sessionId } = useContext(AuthContext)!;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleSessionRevoked = useCallback((data: any) => {
    const { sessionId: revokedSessionId, reason } = data;

    console.log('[Session Monitor] Received session revocation:', {
      revokedSessionId,
      currentSessionId: sessionId,
      match: revokedSessionId === sessionId
    });

    if (revokedSessionId !== sessionId) {
      console.log('[Session Monitor] Not current session, ignoring');
      return;
    }

    console.log('[Session Monitor] Current session revoked, logging out');
    setUser(null, null);

    showToast({
      variant: "error",
      title: "Session Revoked",
      description: reason || "Your session has been revoked. Please log in again.",
    });

    navigate("/login");
  }, [setUser, sessionId, showToast, navigate]);

  useEffect(() => {
    console.log('[Session Monitor] Setting up listener with sessionId:', sessionId);
    const cleanup = onSessionRevoked(handleSessionRevoked);
    return () => {
      console.log('[Session Monitor] Cleaning up listener');
      cleanup();
    };
  }, [onSessionRevoked, handleSessionRevoked]);
};
