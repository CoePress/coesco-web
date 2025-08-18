import { AgentService } from "./agent.service";
import { AuthService } from "./auth.service";
import { CacheService } from "./cache.service";
import { LockingService } from "./locking.service";
import { SocketService } from "./socket.service";

export const agentService = new AgentService();
export const authService = new AuthService();
export const cacheService = new CacheService();
export const lockingService = new LockingService();
export const socketService = new SocketService();
