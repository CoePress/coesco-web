import { Router } from "express";
import { journeyController } from "@/controllers";

const router = Router();

router.get("/", journeyController.getAll);
router.get("/:id", journeyController.getById);
router.get("/:id/overview", journeyController.getOverview);

router.post("/", journeyController.create);

router.patch("/:id", journeyController.update);

router.delete("/:id", journeyController.delete);
router.patch("/:id/stage", journeyController.updateStage);

export default router;
