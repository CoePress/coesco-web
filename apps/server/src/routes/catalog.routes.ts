import { Router } from "express";

import { createCrudEntity } from "@/factories";
import {
  configurationRepository,
  itemRepository,
  optionCategoryRepository,
  optionDetailsRepository,
  optionHeaderRepository,
  optionRuleRepository,
  optionRuleTargetRepository,
  optionRuleTriggerRepository,
  productClassOptionCategoryRepository,
  productClassRepository,
} from "@/repositories";
import {
  CreateConfigurationSchema,
  CreateItemSchema,
  CreateOptionCategorySchema,
  CreateOptionDetailSchema,
  CreateOptionHeaderSchema,
  CreateOptionRuleSchema,
  CreateOptionRuleTargetSchema,
  CreateOptionRuleTriggerSchema,
  CreatePCOCSchema,
  CreateProductClassSchema,
  UpdateConfigurationSchema,
  UpdateItemSchema,
  UpdateOptionCategorySchema,
  UpdateOptionDetailSchema,
  UpdateOptionHeaderSchema,
  UpdateOptionRuleSchema,
  UpdateOptionRuleTargetSchema,
  UpdateOptionRuleTriggerSchema,
  UpdatePCOCSchema,
  UpdateProductClassSchema,
} from "@/schemas";

const router = Router();

// Items
createCrudEntity(router, {
  repository: itemRepository,
  entityName: "Item",
  basePath: "/items",
  idParam: "itemId",
  createSchema: CreateItemSchema,
  updateSchema: UpdateItemSchema,
});

// Product Classes
createCrudEntity(router, {
  repository: productClassRepository,
  entityName: "ProductClass",
  basePath: "/product-classes",
  idParam: "productClassId",
  createSchema: CreateProductClassSchema,
  updateSchema: UpdateProductClassSchema,
});

// Option Categories
createCrudEntity(router, {
  repository: optionCategoryRepository,
  entityName: "OptionCategory",
  basePath: "/option-categories",
  idParam: "categoryId",
  createSchema: CreateOptionCategorySchema,
  updateSchema: UpdateOptionCategorySchema,
});

// Product Class Option Categories
createCrudEntity(router, {
  repository: productClassOptionCategoryRepository,
  entityName: "ProductClassOptionCategory",
  basePath: "/product-class-option-categories",
  idParam: "pcocId",
  createSchema: CreatePCOCSchema,
  updateSchema: UpdatePCOCSchema,
});

// Options (Headers)
createCrudEntity(router, {
  repository: optionHeaderRepository,
  entityName: "OptionHeader",
  basePath: "/options",
  idParam: "optionId",
  createSchema: CreateOptionHeaderSchema,
  updateSchema: UpdateOptionHeaderSchema,
});

// Option Details
createCrudEntity(router, {
  repository: optionDetailsRepository,
  entityName: "OptionDetails",
  basePath: "/option-details",
  idParam: "detailId",
  createSchema: CreateOptionDetailSchema,
  updateSchema: UpdateOptionDetailSchema,
});

// Option Rules
createCrudEntity(router, {
  repository: optionRuleRepository,
  entityName: "OptionRule",
  basePath: "/option-rules",
  idParam: "ruleId",
  createSchema: CreateOptionRuleSchema,
  updateSchema: UpdateOptionRuleSchema,
});

// Option Rule Triggers
createCrudEntity(router, {
  repository: optionRuleTriggerRepository,
  entityName: "OptionRuleTrigger",
  basePath: "/option-rule-triggers",
  idParam: "triggerId",
  createSchema: CreateOptionRuleTriggerSchema,
  updateSchema: UpdateOptionRuleTriggerSchema,
});

// Option Rule Targets
createCrudEntity(router, {
  repository: optionRuleTargetRepository,
  entityName: "OptionRuleTarget",
  basePath: "/option-rule-targets",
  idParam: "targetId",
  createSchema: CreateOptionRuleTargetSchema,
  updateSchema: UpdateOptionRuleTargetSchema,
});

// Configurations
createCrudEntity(router, {
  repository: configurationRepository,
  entityName: "Configuration",
  basePath: "/configurations",
  idParam: "configurationId",
  createSchema: CreateConfigurationSchema,
  updateSchema: UpdateConfigurationSchema,
});

export default router;
