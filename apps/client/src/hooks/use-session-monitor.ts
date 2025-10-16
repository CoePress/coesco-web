import { useEffect, useContext, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/socket.context";
import { AuthContext } from "@/contexts/auth.context";
import { useToast } from "./use-toast";

export const useSessionMonitor = () => {
  const { onSessionRevoked } = useSocket();
  const { setUser, sessionId } = useContext(AuthContext)!;
  const sessionIdRef = useRef(sessionId);
  const navigate = useNavigate();
  const toast = useToast();

  // Keep ref in sync with sessionId
  useEffect(() => {
    sessionIdRef.current = sessionId;
    console.log('[Session Monitor] sessionId updated to:', sessionId);
  }, [sessionId]);

  const handleSessionRevoked = useCallback((data: any) => {
    const { sessionId: revokedSessionId, reason } = data;
    const currentSessionId = sessionIdRef.current;

    console.log('[Session Monitor] Received session revocation:', {
      revokedSessionId,
      currentSessionId,
      match: revokedSessionId === currentSessionId
    });

    if (revokedSessionId !== currentSessionId) {
      console.log('[Session Monitor] Not current session, ignoring');
      return;
    }

    console.log('[Session Monitor] Current session revoked, logging out');
    setUser(null, null);

    toast.error(reason || "Your session has been revoked. Please log in again.");

    navigate("/login");
  }, [setUser, toast, navigate]);

  useEffect(() => {
    console.log('[Session Monitor] Setting up listener');
    const cleanup = onSessionRevoked(handleSessionRevoked);
    return () => {
      console.log('[Session Monitor] Cleaning up listener');
      cleanup();
    };
  }, [onSessionRevoked, handleSessionRevoked]);
};
