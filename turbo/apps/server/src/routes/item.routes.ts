import { Router } from "express";
import { itemController } from "@/controllers";

const router = Router();

router.get("/", itemController.getAll);
router.get("/:id", itemController.getById);
router.post("/", itemController.create);
router.patch("/:id", itemController.update);
router.delete("/:id", itemController.delete);

export default router;
