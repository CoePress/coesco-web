import { configController } from "@/controllers";
import { Router } from "express";

const router = Router();

router.post("/", configController.saveConfiguration);
router.post("/product-class", configController.saveConfiguration);
router.post("/option", configController.saveConfiguration);
router.post("/option-rule", configController.saveConfiguration);
router.get("/classes", configController.getProductClasses);
router.get("/rules", configController.getOptionRules);

router.get(
  "/classes/:id/options",
  configController.getAvailableOptionsGroupedByCategory
);

export default router;
