import { Router } from "express";

import { tagController } from "@/controllers";

const router = Router();

// Tags
router.post("/", tagController.createTag);
router.get("/", tagController.getTags);
router.get("/:tagId", tagController.getTag);
router.patch("/:tagId", tagController.updateTag);
router.delete("/:tagId", tagController.deleteTag);

export default router;
