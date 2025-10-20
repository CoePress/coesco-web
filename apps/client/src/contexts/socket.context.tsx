import { env } from "@/config/env";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import { Socket, Manager } from "socket.io-client";
import { useAuth } from "./auth.context";

type SocketContextType = {
  systemSocket: Socket | null;
  systemStatus: string;
  isSystemConnected: boolean;
  subscribeToSystemStatus: () => void;
  unsubscribeFromSystemStatus: () => void;

  iotSocket: Socket | null;
  machineStates: any[];
  subscribeToMachineStates: () => void;
  unsubscribeFromMachineStates: () => void;

  lockSocket: Socket | null;
  isLockConnected: boolean;
  emit: (event: string, data: any, callback?: (result: any) => void) => void;
  onLockChanged: (callback: (data: any) => void) => () => void;

  sessionSocket: Socket | null;
  isSessionConnected: boolean;
  onSessionRevoked: (callback: (data: any) => void) => () => void;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const { user } = useAuth();
  const managerRef = useRef<Manager | null>(null);
  const systemSocketRef = useRef<Socket | null>(null);
  const [systemStatus, setSystemStatus] = useState("");
  const [isSystemConnected, setIsSystemConnected] = useState(false);
  const iotSocketRef = useRef<Socket | null>(null);
  const [machineStates, setMachineStates] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lockSocketRef = useRef<Socket | null>(null);
  const [isLockConnected, setIsLockConnected] = useState(false);
  const sessionSocketRef = useRef<Socket | null>(null);
  const [isSessionConnected, setIsSessionConnected] = useState(false);

  useEffect(() => {
    managerRef.current = new Manager(env.VITE_BASE_URL, {
      reconnectionDelayMax: 10000,
      transports: ["websocket", "polling"],
    });

    return () => {
      managerRef.current?.engine?.close();
    };
  }, []);

  const subscribeToSystemStatus = useCallback(() => {
    if (!systemSocketRef.current && managerRef.current) {
      systemSocketRef.current = managerRef.current.socket("/system");

      const socket = systemSocketRef.current;
      socket.on("connect", () => {
        setIsSystemConnected(true);
        socket.emit("system_status:subscribe");
      });

      socket.on("disconnect", () => {
        setIsSystemConnected(false);
        setSystemStatus("");
      });

      socket.on("connect_error", () => {
        setIsSystemConnected(false);
        setSystemStatus("");
      });

      socket.on("system_status", (status: string) => {
        setSystemStatus(status);
      });
    } else if (systemSocketRef.current?.connected) {
      systemSocketRef.current.emit("system_status:subscribe");
    }
  }, []);

  const unsubscribeFromSystemStatus = useCallback(() => {
    if (systemSocketRef.current?.connected) {
      systemSocketRef.current.emit("system_status:unsubscribe");
      setSystemStatus("");
    }
  }, []);

  const subscribeToMachineStates = useCallback(() => {
    if (!iotSocketRef.current && managerRef.current) {
      iotSocketRef.current = managerRef.current.socket("/iot");

      const socket = iotSocketRef.current;
      socket.on("connect", () => {
        socket.emit("machine_states:subscribe");
      });

      socket.on("disconnect", () => {
        setIsSubscribed(false);
      });

      socket.on("machine_states:subscribed", () => {
        setIsSubscribed(true);
      });

      socket.on("machine_states", (data: any[]) => {
        setMachineStates(data);
      });
    } else if (iotSocketRef.current?.connected && !isSubscribed) {
      iotSocketRef.current.emit("machine_states:subscribe");
    }
  }, [isSubscribed]);

  const unsubscribeFromMachineStates = useCallback(() => {
    if (iotSocketRef.current?.connected) {
      iotSocketRef.current.emit("machine_states:unsubscribe");
      setIsSubscribed(false);
    }
  }, []);

  useEffect(() => {
    if (user?.id && managerRef.current) {
      if (!lockSocketRef.current) {
        lockSocketRef.current = managerRef.current.socket("/locks");

        const socket = lockSocketRef.current;
        socket.on("connect", () => {
          setIsLockConnected(true);
        });

        socket.on("disconnect", () => {
          setIsLockConnected(false);
        });

        socket.on("connect_error", () => {
          setIsLockConnected(false);
        });
      }
    } else {
      if (lockSocketRef.current) {
        lockSocketRef.current.disconnect();
        lockSocketRef.current = null;
        setIsLockConnected(false);
      }
      if (iotSocketRef.current) {
        iotSocketRef.current.disconnect();
        iotSocketRef.current = null;
        setIsSubscribed(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (user?.id) {
      initializeSessionSocket(user.id);
    } else {
      if (sessionSocketRef.current) {
        sessionSocketRef.current.disconnect();
        sessionSocketRef.current = null;
        setIsSessionConnected(false);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    return () => {
      systemSocketRef.current?.disconnect();
      iotSocketRef.current?.disconnect();
      lockSocketRef.current?.disconnect();
      sessionSocketRef.current?.disconnect();
      managerRef.current?.engine?.close();
    };
  }, []);

  const emit = useCallback((event: string, data: any, callback?: (result: any) => void) => {
    if (lockSocketRef.current?.connected) {
      lockSocketRef.current.emit(event, data, callback);
    }
  }, []);

  const onLockChanged = useCallback((callback: (data: any) => void) => {
    if (lockSocketRef.current) {
      lockSocketRef.current.on("lock:changed", callback);
      return () => {
        lockSocketRef.current?.off("lock:changed", callback);
      };
    }
    return () => {};
  }, []);

  const initializeSessionSocket = (userId: string) => {
    if (userId && managerRef.current) {
      if (sessionSocketRef.current) {
        sessionSocketRef.current.disconnect();
        sessionSocketRef.current = null;
      }

      const socket = managerRef.current.socket("/session", {
        auth: { userId },
      });

      sessionSocketRef.current = socket;

      socket.on("connect", () => {
        setIsSessionConnected(true);
      });

      socket.on("disconnect", () => {
        setIsSessionConnected(false);
      });

      socket.on("connect_error", () => {
        setIsSessionConnected(false);
      });
    }
  };

  const onSessionRevoked = useCallback((callback: (data: any) => void) => {
    if (sessionSocketRef.current) {
      sessionSocketRef.current.on("session:revoked", callback);
      return () => {
        sessionSocketRef.current?.off("session:revoked", callback);
      };
    }
    return () => {};
  }, []);

  const contextValue: SocketContextType = useMemo(() => ({
    systemSocket: systemSocketRef.current,
    systemStatus,
    isSystemConnected,
    subscribeToSystemStatus,
    unsubscribeFromSystemStatus,

    iotSocket: iotSocketRef.current,
    machineStates,
    subscribeToMachineStates,
    unsubscribeFromMachineStates,

    lockSocket: lockSocketRef.current,
    isLockConnected,
    emit,
    onLockChanged,

    sessionSocket: sessionSocketRef.current,
    isSessionConnected,
    onSessionRevoked,
  }), [
    systemStatus,
    isSystemConnected,
    machineStates,
    isLockConnected,
    isSessionConnected,
    subscribeToSystemStatus,
    unsubscribeFromSystemStatus,
    subscribeToMachineStates,
    unsubscribeFromMachineStates,
    emit,
    onLockChanged,
    onSessionRevoked,
  ]);

  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error("useSocket must be used within a SocketProvider");
  }
  return context;
};
