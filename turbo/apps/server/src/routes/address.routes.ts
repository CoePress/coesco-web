import { addressController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", addressController.getAll);
router.get("/:id", addressController.getById);
router.post("/", addressController.create);
router.patch("/:id", addressController.update);
router.delete("/:id", addressController.delete);

export default router;
