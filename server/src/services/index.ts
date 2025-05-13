import { io } from "@/app";
import { AuthService } from "./auth.service";
import { EmployeeService } from "./employee.service";
import { MachineDataService } from "./machine-data.service";
import { MachineService } from "./machine.service";
import { QuoteService } from "./quote.service";
import { SocketService } from "./socket.service";

export const authService = new AuthService();
export const employeeService = new EmployeeService();
export const machineService = new MachineService();
export const quoteService = new QuoteService();
export const machineDataService = new MachineDataService();

// Initialize socket service after io is ready
let socketService: SocketService;
export const initializeSocketService = () => {
  socketService = new SocketService(io);
  return socketService;
};

export const getSocketService = () => {
  if (!socketService) {
    throw new Error("SocketService not initialized");
  }
  return socketService;
};
