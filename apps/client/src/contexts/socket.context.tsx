import env from "@/config/env";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  isConnected: boolean;
  socket: Socket | null;
  emit: (event: string, data: any, callback?: (...args: any[]) => void) => void;
  machineStates: any[];
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
  listenTo: string[];
};

export const SocketProvider = ({ children, listenTo }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [machineStates, setMachineStates] = useState<any[]>([]);

  // Single connection effect
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${env.VITE_BASE_URL}/client`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

      const socket = socketRef.current;

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
    }

    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []); // Empty dependency array - only run once

  // Handle machine states
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

  // Handle dynamic event subscriptions
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    // Remove all existing listeners
    socket.removeAllListeners();

    // Re-add the essential listeners
    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("machine_states", (data: any[]) => setMachineStates(data));

    // Add dynamic listeners
    listenTo.forEach((event) => {
      socket.on(event, () => {
        // Handle dynamic events here if needed
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [listenTo]); // Only re-run when listenTo changes

  const emit = (
    event: string,
    data: any,
    callback?: (...args: any[]) => void
  ) => {
    if (socketRef.current?.connected) {
      if (callback) {
        socketRef.current.emit(event, data, callback);
      } else {
        socketRef.current.emit(event, data);
      }
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
