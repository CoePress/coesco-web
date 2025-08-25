import { io } from "@/app";

import { DeviceService } from "./business/device.service";
import { LegacyService } from "./business/legacy.service";
import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { QuoteBuilderService } from "./business/quote-builder.service";
import { AgentService } from "./core/agent.service";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { LockingService } from "./core/locking.service";
import { McpService } from "./core/mcp.service";
import { SocketService } from "./core/socket.service";

// Business
export const deviceService = new DeviceService();
export const legacyService = new LegacyService();
export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();
export const quoteBuilderService = new QuoteBuilderService();

// Core
export const agentService = new AgentService();
export const authService = new AuthService();
export const cacheService = new CacheService();
export const lockingService = new LockingService();
export const mcpService = new McpService();
export const socketService = new SocketService();

export async function initializeServices() {
  await socketService.initialize(io);
  await machiningService.initialize();
  await mcpService.initialize();
  await deviceService.initialize();
}
