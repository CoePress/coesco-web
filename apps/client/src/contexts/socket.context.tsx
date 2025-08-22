import env from "@/config/env";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

type SocketContextType = {
  isConnected: boolean;
  socket: Socket | null;
  emit: (event: string, data: any, callback?: (...args: any[]) => void) => void;
  machineStates: any[];
  iotSocket: Socket | null;
  isIotConnected: boolean;
  subscribeToMachineStates: () => void;
  unsubscribeFromMachineStates: () => void;
};

export const SocketContext = createContext<SocketContextType | undefined>(
  undefined
);

type SocketProviderProps = {
  children: React.ReactNode;
  listenTo?: string[];
};

export const SocketProvider = ({ children, listenTo = [] }: SocketProviderProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const [machineStates, setMachineStates] = useState<any[]>([]);
  const [isIotConnected, setIsIotConnected] = useState(false);
  const iotSocketRef = useRef<Socket | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);

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
      iotSocketRef.current?.disconnect();
      iotSocketRef.current = null;
    };
  }, []);

  const subscribeToMachineStates = () => {
    if (!iotSocketRef.current) {
      iotSocketRef.current = io(`${env.VITE_BASE_URL}/iot`, {
        reconnectionDelayMax: 10000,
        transports: ["websocket", "polling"],
      });

      const iotSocket = iotSocketRef.current;

      iotSocket.on("connect", () => {
        setIsIotConnected(true);
        iotSocket.emit("machine_states:subscribe");
      });

      iotSocket.on("disconnect", () => {
        setIsIotConnected(false);
        setIsSubscribed(false);
      });

      iotSocket.on("machine_states:subscribed", () => {
        setIsSubscribed(true);
      });

      iotSocket.on("machine_states", (data: any[]) => {
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
    const socket = socketRef.current;
    if (!socket) return;

    socket.removeAllListeners();

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));

    listenTo.forEach((event) => {
      socket.on(event, () => {
      });
    });

    return () => {
      socket.removeAllListeners();
    };
  }, [listenTo]);

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
    iotSocket: iotSocketRef.current,
    isIotConnected,
    subscribeToMachineStates,
    unsubscribeFromMachineStates,
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
