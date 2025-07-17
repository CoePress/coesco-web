import { configController } from "@/controllers";
import { Router } from "express";

const router = Router();

// Configurations
router.get("/", configController.getConfigurations);
router.get("/:id", configController.getConfiguration);
router.post("/", configController.createConfiguration);
router.patch("/:id", configController.updateConfiguration);
router.delete("/:id", configController.deleteConfiguration);

// Product Classes
router.get("/classes/", configController.getProductClasses);
router.get("/classes/:id", configController.getProductClass);
router.get("/classes/:id/options", configController.getProductClassOptions);
router.post("/classes/", configController.createProductClass);
router.patch("/classes/:id", configController.updateProductClass);
router.delete("/classes/:id", configController.deleteProductClass);

// Option Categories
router.get("/categories/", configController.getOptionCategories);
router.get("/categories/:id", configController.getOptionCategory);
router.post("/categories/", configController.createOptionCategory);
router.patch("/categories/:id", configController.updateOptionCategory);
router.delete("/categories/:id", configController.deleteOptionCategory);

// Options
router.get("/options/", configController.getOptions);
router.get("/options/:id", configController.getOption);
router.post("/options/", configController.createOption);
router.patch("/options/:id", configController.updateOption);
router.delete("/options/:id", configController.deleteOption);

// Option Rules
router.get("/rules/", configController.getOptionRules);
router.get("/rules/:id", configController.getOptionRule);
router.post("/rules/", configController.createOptionRule);
router.patch("/rules/:id", configController.updateOptionRule);
router.delete("/rules/:id", configController.deleteOptionRule);

export default router;
