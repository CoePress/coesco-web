import { configBuilderController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/", configBuilderController.saveConfiguration);
router.post("/product-class", configBuilderController.saveConfiguration);
router.post("/option", configBuilderController.saveConfiguration);
router.post("/option-rule", configBuilderController.saveConfiguration);

router.get("/configurations", configBuilderController.getConfigurations);
router.get("/classes", configBuilderController.getProductClasses);
router.get("/rules", configBuilderController.getOptionRules);

router.get(
  "/classes/:id/options",
  configBuilderController.getAvailableOptionsGroupedByCategory
);

export default router;
