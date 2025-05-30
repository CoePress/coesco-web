import { Router } from "express";
import { companyController } from "@/controllers";

const router = Router();

router.get("/", companyController.getAll);
router.get("/:id", companyController.getById);
router.post("/", companyController.create);
router.patch("/:id", companyController.update);
router.delete("/:id", companyController.delete);

export default router;
