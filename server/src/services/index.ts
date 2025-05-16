import { io } from "@/app";
import { AuthService } from "./auth.service";
import { CacheService } from "./cache.service";
import { EmailService } from "./email.service";
import { EmployeeService } from "./employee.service";
import { MachineService } from "./machine.service";
import { MachineDataService } from "./machine-data.service";
import { QuoteService } from "./quote.service";
import { SocketService } from "./socket.service";

let socketService: SocketService;
export const socketInstance = () => {
  if (!socketService) {
    socketService = new SocketService(io);
  }
  return socketService;
};

export const authService = new AuthService();
export const cacheService = new CacheService();
export const emailService = new EmailService();
export const employeeService = new EmployeeService();
export const machineService = new MachineService();
export const machineDataService = new MachineDataService();
export const quoteService = new QuoteService();
