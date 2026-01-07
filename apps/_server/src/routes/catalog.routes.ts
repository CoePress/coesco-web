import { Router } from "express";

import { configurationController, optionController, productController } from "@/controllers";

const router = Router();

// Items
router.post("/items", productController.createItem);
router.get("/items", productController.getItems);
router.get("/items/:itemId", productController.getItem);
router.patch("/items/:itemId", productController.updateItem);
router.delete("/items/:itemId", productController.deleteItem);

// Product Classes
router.post("/product-classes", productController.createProductClass);
router.get("/product-classes", productController.getProductClasses);
router.get("/product-classes/:productClassId", productController.getProductClass);
router.patch("/product-classes/:productClassId", productController.updateProductClass);
router.delete("/product-classes/:productClassId", productController.deleteProductClass);

// Option Categories
router.post("/option-categories", optionController.createOptionCategory);
router.get("/option-categories", optionController.getOptionCategories);
router.get("/option-categories/:categoryId", optionController.getOptionCategory);
router.patch("/option-categories/:categoryId", optionController.updateOptionCategory);
router.delete("/option-categories/:categoryId", optionController.deleteOptionCategory);

// Product Class Option Categories
router.post("/product-class-option-categories", optionController.createPCOC);
router.get("/product-class-option-categories", optionController.getPCOCs);
router.get("/product-class-option-categories/:pcocId", optionController.getPCOC);
router.patch("/product-class-option-categories/:pcocId", optionController.updatePCOC);
router.delete("/product-class-option-categories/:pcocId", optionController.deletePCOC);

// Options (Headers)
router.post("/options", optionController.createOptionHeader);
router.get("/options", optionController.getOptionHeaders);
router.get("/options/:optionId", optionController.getOptionHeader);
router.patch("/options/:optionId", optionController.updateOptionHeader);
router.delete("/options/:optionId", optionController.deleteOptionHeader);

// Option Details
router.post("/option-details", optionController.createOptionDetail);
router.get("/option-details", optionController.getOptionDetails);
router.get("/option-details/:detailId", optionController.getOptionDetail);
router.patch("/option-details/:detailId", optionController.updateOptionDetail);
router.delete("/option-details/:detailId", optionController.deleteOptionDetail);

// Option Rules
router.post("/option-rules", optionController.createOptionRule);
router.get("/option-rules", optionController.getOptionRules);
router.get("/option-rules/:ruleId", optionController.getOptionRule);
router.patch("/option-rules/:ruleId", optionController.updateOptionRule);
router.delete("/option-rules/:ruleId", optionController.deleteOptionRule);

// Option Rule Triggers
router.post("/option-rule-triggers", optionController.createOptionRuleTrigger);
router.get("/option-rule-triggers", optionController.getOptionRuleTriggers);
router.get("/option-rule-triggers/:triggerId", optionController.getOptionRuleTrigger);
router.patch("/option-rule-triggers/:triggerId", optionController.updateOptionRuleTrigger);
router.delete("/option-rule-triggers/:triggerId", optionController.deleteOptionRuleTrigger);

// Option Rule Targets
router.post("/option-rule-targets", optionController.createOptionRuleTarget);
router.get("/option-rule-targets", optionController.getOptionRuleTargets);
router.get("/option-rule-targets/:targetId", optionController.getOptionRuleTarget);
router.patch("/option-rule-targets/:targetId", optionController.updateOptionRuleTarget);
router.delete("/option-rule-targets/:targetId", optionController.deleteOptionRuleTarget);

// Configurations
router.post("/configurations", configurationController.createConfiguration);
router.get("/configurations", configurationController.getConfigurations);
router.get("/configurations/:configurationId", configurationController.getConfiguration);
router.patch("/configurations/:configurationId", configurationController.updateConfiguration);
router.delete("/configurations/:configurationId", configurationController.deleteConfiguration);

// // Configuration Options
// router.post("/configuration-options", configurationController.createConfigurationOption);
// router.get("/configuration-options", configurationController.getConfigurationOptions);
// router.get("/configuration-options/:configurationOptionId", configurationController.getConfigurationOption);
// router.patch("/configuration-options/:configurationOptionId", configurationController.updateConfigurationOption);
// router.delete("/configuration-options/:configurationOptionId", configurationController.deleteConfigurationOption);

export default router;
