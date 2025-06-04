import { Router } from "express";
import { quoteController } from "@/controllers";

const router = Router();

router.get("/", quoteController.getAll);
router.get("/:id", quoteController.getById);
router.get("/:id/items", quoteController.getItems);
router.get("/:id/overview", quoteController.getOverview);

router.post("/", quoteController.create);
router.post("/:id/items", quoteController.addItem);

router.patch("/:id", quoteController.update);

router.delete("/:id", quoteController.delete);
router.delete("/:id/items/:itemId", quoteController.removeItem);

export default router;
