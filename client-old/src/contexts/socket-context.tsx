import env from "@/config/env";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { io, Socket } from "socket.io-client";

interface MachineData {
  state: string;
  data: any;
}

interface SocketState {
  isConnected: boolean;
  machineData: Record<string, MachineData>;
}

interface SocketContextValue extends SocketState {
  emit: <T>(event: string, data: T) => void;
  getMachineState: (machineId: string) => string;
  getMachineData: (machineId: string) => MachineData | null;
}

export const SocketContext = createContext<SocketContextValue | undefined>(
  undefined
);

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<SocketState>({
    isConnected: false,
    machineData: {},
  });

  const socketRef = useRef<Socket | null>(null);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;

    socketRef.current = io(`${env.VITE_API_URL}/clients`, {
      reconnectionDelayMax: 10000,
      reconnectionAttempts: Infinity,
      transports: ["websocket", "polling"],
    });

    const socket = socketRef.current;

    const handleConnect = () => {
      if (!mountedRef.current) return;
      setState((prev) => ({ ...prev, isConnected: true }));
    };

    const handleDisconnect = () => {
      if (!mountedRef.current) return;
      setState((prev) => ({ ...prev, isConnected: false }));
    };

    const handleMachineData = (data: Record<string, MachineData>) => {
      if (!mountedRef.current) return;
      setState((prev) => ({
        ...prev,
        machineData: data,
      }));
    };

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("machine_data", handleMachineData);

    return () => {
      mountedRef.current = false;
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("machine_data", handleMachineData);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [env.VITE_API_URL]);

  const emit = <T,>(event: string, data: T) => {
    if (socketRef.current?.connected) {
      socketRef.current.emit(event, data);
    }
  };

  const getMachineState = (machineId: string): string => {
    return state.machineData[machineId]?.state || "OFFLINE";
  };

  const getMachineData = (machineId: string): MachineData | null => {
    return state.machineData[machineId] || null;
  };

  return (
    <SocketContext.Provider
      value={{
        ...state,
        emit,
        getMachineState,
        getMachineData,
      }}>
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
