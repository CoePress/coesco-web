import { io } from "@/app";

import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { socketService } from "./core";
import { DeviceService } from "./business/device.service";

export const deviceService = new DeviceService();
export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();

export async function initializeServices() {
  socketService.initialize(io);
  await machiningService.initialize();
  await deviceService.startMonitoring();
  console.log("Device monitoring service started");
}