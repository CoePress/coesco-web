import { env } from "@/config/env";
import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

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
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const systemSocketRef = useRef<Socket | null>(null);
  const [systemStatus, setSystemStatus] = useState("");
  const [isSystemConnected, setIsSystemConnected] = useState(false);
  const iotSocketRef = useRef<Socket | null>(null);
  const [machineStates, setMachineStates] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const lockSocketRef = useRef<Socket | null>(null);
  const [isLockConnected, setIsLockConnected] = useState(false);

  const subscribeToSystemStatus = () => {
    if (!systemSocketRef.current) {
      systemSocketRef.current = io(`${env.VITE_BASE_URL}/system`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

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
    } else if (systemSocketRef.current.connected) {
      systemSocketRef.current.emit("system_status:subscribe");
    }
  };

  const unsubscribeFromSystemStatus = () => {
    if (systemSocketRef.current?.connected) {
      systemSocketRef.current.emit("system_status:unsubscribe");
      setSystemStatus("");
    }
  };

  const subscribeToMachineStates = () => {
    if (!iotSocketRef.current) {
      iotSocketRef.current = io(`${env.VITE_BASE_URL}/iot`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

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
    } else if (iotSocketRef.current.connected && !isSubscribed) {
      iotSocketRef.current.emit("machine_states:subscribe");
    }
  };

  const unsubscribeFromMachineStates = () => {
    if (iotSocketRef.current?.connected) {
      iotSocketRef.current.emit("machine_states:unsubscribe");
      setIsSubscribed(false);
    }
  };

  useEffect(() => {
    // Initialize lock socket on mount
    if (!lockSocketRef.current) {
      lockSocketRef.current = io(`${env.VITE_BASE_URL}/locks`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

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

    return () => {
      systemSocketRef.current?.disconnect();
      iotSocketRef.current?.disconnect();
      lockSocketRef.current?.disconnect();
    };
  }, []);

  const emit = (event: string, data: any, callback?: (result: any) => void) => {
    if (lockSocketRef.current?.connected) {
      lockSocketRef.current.emit(event, data, callback);
    }
  };

  const onLockChanged = (callback: (data: any) => void) => {
    if (lockSocketRef.current) {
      lockSocketRef.current.on("lock:changed", callback);
      return () => {
        lockSocketRef.current?.off("lock:changed", callback);
      };
    }
    return () => {};
  };

  const contextValue: SocketContextType = {
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
  };

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
