import { io } from "@/app";

import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { socketService } from "./core";

export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();

export function initializeServices() {
  socketService.initialize(io);
  machiningService.initialize();
}
