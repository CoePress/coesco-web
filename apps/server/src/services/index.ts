import { io } from "@/app";
import { logger } from "@/utils/logger";

import { DeviceService } from "./business/device.service";
import { LegacyService } from "./business/legacy.service";
import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { socketService } from "./core";

export const deviceService = new DeviceService();
export const legacyService = new LegacyService();
export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();

export async function initializeServices() {
  socketService.initialize(io);
  await machiningService.initialize();
  await deviceService.startMonitoring();
  logger.info("Device monitoring service started");
}
