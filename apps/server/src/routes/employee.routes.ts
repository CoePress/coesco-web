import { Router } from "express";
import { employeeController } from "@/controllers";

const router = Router();

router.get("/", employeeController.getAll);
router.get("/:id", employeeController.getById);
router.post("/", employeeController.create);
router.patch("/:id", employeeController.update);
router.delete("/:id", employeeController.delete);

export default router;
