import { configController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", configController.getOptionsByProductClass);

export default router;
