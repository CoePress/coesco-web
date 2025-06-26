import { configBuilderController } from "@/controllers";
import { Router } from "express";

const router = Router();

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

export default router;
