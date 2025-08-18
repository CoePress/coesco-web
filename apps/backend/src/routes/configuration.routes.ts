import { Router } from "express";

import { configurationController } from "@/controllers";

const router = Router();

// Items
router.post("/items", configurationController.createItem);
router.get("/items", configurationController.getItems);
router.get("/items/:itemId", configurationController.getItem);
router.patch("/items/:itemId", configurationController.updateItem);
router.delete("/items/:itemId", configurationController.deleteItem);

// Product Classes
router.post("/product-classes", configurationController.createProductClass);
router.get("/product-classes", configurationController.getProductClasses);
router.get("/product-classes/:productClassId", configurationController.getProductClass);
router.patch("/product-classes/:productClassId", configurationController.updateProductClass);
router.delete("/product-classes/:productClassId", configurationController.deleteProductClass);

// Option Categories
router.post("/option-categories", configurationController.createOptionCategory);
router.get("/option-categories", configurationController.getOptionCategories);
router.get("/option-categories/:categoryId", configurationController.getOptionCategory);
router.patch("/option-categories/:categoryId", configurationController.updateOptionCategory);
router.delete("/option-categories/:categoryId", configurationController.deleteOptionCategory);

// Product Class Option Categories
router.post("/product-class-option-categories", configurationController.createPCOC);
router.get("/product-class-option-categories", configurationController.getPCOCs);
router.get("/product-class-option-categories/:pcocId", configurationController.getPCOC);
router.patch("/product-class-option-categories/:pcocId", configurationController.updatePCOC);
router.delete("/product-class-option-categories/:pcocId", configurationController.deletePCOC);

// Convenience Joins
router.get(
  "/product-classes/:productClassId/option-categories",
  configurationController.listPCOCsForProductClass,
);
router.get(
  "/option-categories/:categoryId/product-classes",
  configurationController.listPCOCsForCategory,
);

// Options (Headers)
router.post("/options", configurationController.createOptionHeader);
router.get("/options", configurationController.getOptionHeaders);
router.get("/options/:optionId", configurationController.getOptionHeader);
router.patch("/options/:optionId", configurationController.updateOptionHeader);
router.delete("/options/:optionId", configurationController.deleteOptionHeader);

// Option Details
router.post("/options/:optionId/details", configurationController.createOptionDetail);
router.get("/options/:optionId/details", configurationController.getOptionsDetails);
router.get("/options/:optionId/details/:detailId", configurationController.getOptionDetail);
router.patch("/options/:optionId/details/:detailId", configurationController.updateOptionDetail);
router.delete("/options/:optionId/details/:detailId", configurationController.deleteOptionDetail);

// Option Rules
router.post("/option-rules", configurationController.createOptionRule);
router.get("/option-rules", configurationController.getOptionRules);
router.get("/option-rules/:ruleId", configurationController.getOptionRule);
router.patch("/option-rules/:ruleId", configurationController.updateOptionRule);
router.delete("/option-rules/:ruleId", configurationController.deleteOptionRule);

// Option Rule Triggers
router.get("/option-rules/:ruleId/triggers", configurationController.listRuleTriggers);
router.post("/option-rules/:ruleId/triggers", configurationController.addRuleTrigger);
router.delete(
  "/option-rules/:ruleId/triggers/:optionId",
  configurationController.removeRuleTrigger,
);

// Option Rule Targets
router.get("/option-rules/:ruleId/targets", configurationController.listRuleTargets);
router.post("/option-rules/:ruleId/targets", configurationController.addRuleTarget);
router.delete(
  "/option-rules/:ruleId/targets/:optionId",
  configurationController.removeRuleTarget,
);

// Configurations
router.post("/configurations", configurationController.createConfiguration);
router.get("/configurations", configurationController.getConfigurations);
router.get("/configurations/:configurationId", configurationController.getConfiguration);
router.patch("/configurations/:configurationId", configurationController.updateConfiguration);
router.delete("/configurations/:configurationId", configurationController.deleteConfiguration);

// Configuration Options
router.get(
  "/configurations/:configurationId/options",
  configurationController.listSelectedOptions,
);
router.post(
  "/configurations/:configurationId/options",
  configurationController.addSelectedOption,
);
router.delete(
  "/configurations/:configurationId/options/:optionId",
  configurationController.removeSelectedOption,
);

export default router;
