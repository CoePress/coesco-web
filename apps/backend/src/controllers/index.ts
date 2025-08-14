import { AuthController } from "./auth.controller";
import { ChatController } from "./chat.controller";
import { SystemController } from "./system.controller";

export const authController = new AuthController();
export const chatController = new ChatController();
export const systemController = new SystemController();
