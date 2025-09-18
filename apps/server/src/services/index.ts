import { io } from "@/app";

import { AgentService } from "./business/agent.service";
import { DeviceService } from "./business/device.service";
import { FormManagerService } from "./business/form-manager.service";
import { LegacyService } from "./business/legacy.service";
import { MachineMonitorService } from "./business/machining.service";
import { MicrosoftService } from "./business/microsoft.service";
import { QuotingService } from "./business/quoting.service";
import { AuthService } from "./core/auth.service";
import { CacheService } from "./core/cache.service";
import { LockingService } from "./core/locking.service";
import { MCPService } from "./core/mcp.service";
import { PermissionService } from "./core/permission.service";
import { SocketService } from "./core/socket.service";

// Business
export const agentService = new AgentService();
export const deviceService = new DeviceService();
export const formManagerService = new FormManagerService();
export const legacyService = new LegacyService();
export const machiningService = new MachineMonitorService();
export const microsoftService = new MicrosoftService();
export const quotingService = new QuotingService();

// Core
export const authService = new AuthService();
export const cacheService = new CacheService();
export const lockingService = new LockingService();
export const mcpService = new MCPService();
export const permissionService = new PermissionService();
export const socketService = new SocketService();

export async function initializeServices() {
  await deviceService.initialize();
  await legacyService.initialize();
  await machiningService.initialize();
  await mcpService.initialize();
  await socketService.initialize(io);
  await authService.initializeDefaultUser();
}
