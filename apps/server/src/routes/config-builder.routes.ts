import { configBuilderController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/product-classes", configBuilderController.getProductClasses);

export default router;
