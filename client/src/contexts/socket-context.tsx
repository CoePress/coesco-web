import env from "@/config/env";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  isConnected: boolean;
  socket: Socket | null;
  emit: (event: string, data: any) => void;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
  listenTo: string[];
};

export const SocketProvider = ({
  children,
  listenTo = [],
}: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  // 1. Only create the socket once, on mount
  useEffect(() => {
    if (!socketRef.current) {
      socketRef.current = io(`${env.VITE_API_URL}/client`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

      const socket = socketRef.current;

      socket.on("connect", () => setIsConnected(true));
      socket.on("disconnect", () => setIsConnected(false));
    }

    // 3. Only disconnect on unmount
    return () => {
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // 2. Add/remove event listeners when listenTo changes
  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    console.log("[SocketProvider] Listening to events:", listenTo);

    // Add listeners
    listenTo.forEach((event) => {
      socket.on(event, (data) => {
        console.log(`Received ${event} event:`, data);
      });
    });

    return () => {
      listenTo.forEach((event) => {
        socket.off(event);
      });
    };
  }, [listenTo]);

  const emit = (event: string, data: any) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const contextValue = {
    isConnected,
    socket: socketRef.current,
    emit,
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
