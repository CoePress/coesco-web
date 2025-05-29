import { dealerController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", dealerController.getAll);
router.get("/:id", dealerController.getById);
router.post("/", dealerController.create);
router.patch("/:id", dealerController.update);
router.delete("/:id", dealerController.delete);

export default router;
