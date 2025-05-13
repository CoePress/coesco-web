import env from "@/config/env";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useLocation } from "react-router-dom";

type SocketContextType = {
  isConnected: boolean;
  socket: Socket | null;
  emit: (event: string, data: any) => void;
  machineStates: any[];
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
  listenTo: string[];
};

export const SocketProvider = ({ children }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [machineStates, setMachineStates] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Only handle login page disconnection
    if (location.pathname === "/login") {
      socketRef.current?.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      return;
    }

    // Connect only if not connected and not on login page
    if (!socketRef.current && location.pathname !== "/login") {
      socketRef.current = io(`${env.VITE_BASE_URL}/client`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

      const socket = socketRef.current;

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
    }

    return () => {
      // Only disconnect on unmount, not on every location change
      if (location.pathname === "/login") {
        socketRef.current?.disconnect();
        socketRef.current = null;
      }
    };
  }, [location.pathname]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const handleMachineStates = (data: any[]) => {
      setMachineStates(data);
    };

    socket.on("machine_states", handleMachineStates);

    return () => {
      socket.off("machine_states", handleMachineStates);
    };
  }, []);

  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const contextValue = {
    isConnected,
    socket: socketRef.current,
    emit,
    machineStates,
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
