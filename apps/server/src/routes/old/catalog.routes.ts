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

// Options (Headers)
router.post("/options", configurationController.createOptionHeader);
router.get("/options", configurationController.getOptionHeaders);
router.get("/options/:optionId", configurationController.getOptionHeader);
router.patch("/options/:optionId", configurationController.updateOptionHeader);
router.delete("/options/:optionId", configurationController.deleteOptionHeader);

// Option Details
router.post("/option-details", configurationController.createOptionDetail);
router.get("/option-details", configurationController.getOptionDetails);
router.get("/option-details/:detailId", configurationController.getOptionDetail);
router.patch("/option-details/:detailId", configurationController.updateOptionDetail);
router.delete("/option-details/:detailId", configurationController.deleteOptionDetail);

// Option Rules
router.post("/option-rules", configurationController.createOptionRule);
router.get("/option-rules", configurationController.getOptionRules);
router.get("/option-rules/:ruleId", configurationController.getOptionRule);
router.patch("/option-rules/:ruleId", configurationController.updateOptionRule);
router.delete("/option-rules/:ruleId", configurationController.deleteOptionRule);

// Option Rule Triggers
router.post("/option-rule-triggers", configurationController.createOptionRuleTrigger);
router.get("/option-rule-triggers", configurationController.getOptionRuleTriggers);
router.get("/option-rule-triggers/:triggerId", configurationController.getOptionRuleTrigger);
router.patch("/option-rule-triggers/:triggerId", configurationController.updateOptionRuleTrigger);
router.delete("/option-rule-triggers/:triggerId", configurationController.deleteOptionRuleTrigger);

// Option Rule Targets
router.post("/option-rule-targets", configurationController.createOptionRuleTarget);
router.get("/option-rule-targets", configurationController.getOptionRuleTargets);
router.get("/option-rule-targets/:targetId", configurationController.getOptionRuleTarget);
router.patch("/option-rule-targets/:targetId", configurationController.updateOptionRuleTarget);
router.delete("/option-rule-targets/:targetId", configurationController.deleteOptionRuleTarget);

// Configurations
router.post("/configurations", configurationController.createConfiguration);
router.get("/configurations", configurationController.getConfigurations);
router.get("/configurations/:configurationId", configurationController.getConfiguration);
router.patch("/configurations/:configurationId", configurationController.updateConfiguration);
router.delete("/configurations/:configurationId", configurationController.deleteConfiguration);

// Configuration Options
router.post("/configuration-options", configurationController.createConfigurationOption);
router.get("/configuration-options", configurationController.getConfigurationOptions);
router.get("/configuration-options/:configurationOptionId", configurationController.getConfigurationOption);
router.patch("/configuration-options/:configurationOptionId", configurationController.updateConfigurationOption);
router.delete("/configuration-options/:configurationOptionId", configurationController.deleteConfigurationOption);

export default router;
