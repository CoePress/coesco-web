import { Router } from "express";
import { quoteController } from "@/controllers";

const router = Router();

router.get("/", quoteController.getAll);
router.get("/:id", quoteController.getById);
router.post("/", quoteController.create);
router.patch("/:id", quoteController.update);
router.delete("/:id", quoteController.delete);

export default router;
