import { io } from "@/app";

import { DeviceService } from "./business/device.service";
import { LegacyService } from "./business/legacy.service";
import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { QuoteBuilderService } from "./business/quote-builder.service";
import { mcpService, socketService } from "./core";

export const deviceService = new DeviceService();
export const legacyService = new LegacyService();
export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();
export const quoteBuilderService = new QuoteBuilderService();

export async function initializeServices() {
  await socketService.initialize(io);
  await machiningService.initialize();
  await mcpService.initialize();
  await deviceService.initialize();
}
