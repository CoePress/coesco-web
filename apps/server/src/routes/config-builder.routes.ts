import { configBuilderController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.get("/configurations", configBuilderController.getConfigurations);
router.get("/classes", configBuilderController.getProductClasses);
router.get(
  "/classes/:id/categories",
  configBuilderController.getOptionCategoriesByProductClass
);
router.get(
  "/classes/:id/categories/:categoryId/options",
  configBuilderController.getOptionsByOptionCategory
);
router.get(
  "/classes/:id/options",
  configBuilderController.getOptionsByProductClass
);
router.get(
  "/classes/:id/options/grouped",
  configBuilderController.getAvailableOptionsGroupedByCategory
);

router.get("/rules", configBuilderController.getOptionRules);

export default router;
