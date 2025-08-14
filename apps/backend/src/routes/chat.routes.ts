import { Router } from "express";

import { chatController } from "@/controllers";

const router = Router();

router.post("/", chatController.createChat);
router.get("/", chatController.getChats);
router.get("/:chatId", chatController.getChat);
router.get("/:chatId/messages", chatController.getMessages);
router.patch("/:chatId", chatController.updateChat);
router.delete("/:chatId", chatController.deleteChat);

export default router;
