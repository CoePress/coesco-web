import { useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useSocket } from "@/contexts/socket.context";
import { AuthContext } from "@/contexts/auth.context";
import { useToast } from "./use-toast";

export const useSessionMonitor = () => {
  const { onSessionRevoked, isSessionConnected } = useSocket();
  const { setUser, sessionId } = useContext(AuthContext)!;
  const sessionIdRef = useRef(sessionId);
  const navigate = useNavigate();
  const toast = useToast();
  const setUserRef = useRef(setUser);
  const toastRef = useRef(toast);
  const navigateRef = useRef(navigate);

  // Keep refs in sync
  useEffect(() => {
    sessionIdRef.current = sessionId;
    console.log('[Session Monitor] sessionId updated to:', sessionId);
  }, [sessionId]);

  useEffect(() => {
    setUserRef.current = setUser;
  }, [setUser]);

  useEffect(() => {
    toastRef.current = toast;
  }, [toast]);

  useEffect(() => {
    navigateRef.current = navigate;
  }, [navigate]);

  useEffect(() => {
    if (!isSessionConnected) {
      console.log('[Session Monitor] Session socket not connected yet, waiting...');
      return;
    }

    console.log('[Session Monitor] Setting up listener');

    const handleSessionRevoked = (data: any) => {
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

      toastRef.current.clearToasts();

      setUserRef.current(null, null);

      toastRef.current.error(reason || "Your session has been revoked. Please log in again.");

      navigateRef.current("/login");
    };

    const cleanup = onSessionRevoked(handleSessionRevoked);

    return () => {
      console.log('[Session Monitor] Cleaning up listener');
      cleanup();
    };
  }, [onSessionRevoked, isSessionConnected]);
};
