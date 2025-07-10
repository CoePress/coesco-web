import { Router } from "express";
import { configController } from "@/controllers";

const router = Router();

router.get("/", configController.getOptionCategoriesByProductClass);

export default router;
