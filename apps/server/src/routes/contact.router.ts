import { contactController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", contactController.getAll);
router.get("/:id", contactController.getById);
router.post("/", contactController.create);
router.patch("/:id", contactController.update);
router.delete("/:id", contactController.delete);

export default router;
