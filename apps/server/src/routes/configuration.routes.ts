import { configBuilderController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/", configBuilderController.getConfigurations);

export default router;
