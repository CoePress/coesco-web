import { OptionRuleAction } from "@prisma/client";
import { z } from "zod";

// Product schemas
export const CreateItemSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID").optional(),
  modelNumber: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  legacy: z.record(z.any()).optional(),
});

export const UpdateItemSchema = CreateItemSchema.partial();

export const CreateProductClassSchema = z.object({
  code: z.string().min(1, "Code is required"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  parentId: z.string().uuid("Invalid parent ID").optional(),
  legacy: z.record(z.any()).optional(),
});

export const UpdateProductClassSchema = CreateProductClassSchema.partial();

// Option schemas
export const CreateOptionCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  multiple: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  legacy: z.record(z.any()).optional(),
});

export const UpdateOptionCategorySchema = CreateOptionCategorySchema.partial();

export const CreatePCOCSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID"),
  optionCategoryId: z.string().uuid("Invalid option category ID"),
  displayOrder: z.number().int().default(0),
  isRequired: z.boolean().default(false),
});

export const UpdatePCOCSchema = CreatePCOCSchema.partial();

export const CreateOptionHeaderSchema = z.object({
  optionCategoryId: z.string().uuid("Invalid option category ID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  legacyId: z.string().optional(),
});

export const UpdateOptionHeaderSchema = CreateOptionHeaderSchema.partial();

export const CreateOptionDetailSchema = z.object({
  optionHeaderId: z.string().uuid("Invalid option header ID"),
  productClassId: z.string().uuid("Invalid product class ID").optional(),
  itemId: z.string().uuid("Invalid item ID").optional(),
  price: z.union([z.number(), z.string()]).transform(val => val),
});

export const UpdateOptionDetailSchema = CreateOptionDetailSchema.partial();

export const CreateOptionRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action: z.nativeEnum(OptionRuleAction),
  priority: z.number().int().default(0),
  condition: z.record(z.any()),
});

export const UpdateOptionRuleSchema = CreateOptionRuleSchema.partial();

export const CreateOptionRuleTargetSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID"),
  optionId: z.string().uuid("Invalid option ID"),
});

export const UpdateOptionRuleTargetSchema = CreateOptionRuleTargetSchema.partial();

export const CreateOptionRuleTriggerSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID"),
  optionId: z.string().uuid("Invalid option ID"),
});

export const UpdateOptionRuleTriggerSchema = CreateOptionRuleTriggerSchema.partial();

// Configuration schemas
export const CreateConfigurationSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  isTemplate: z.boolean(),
  legacy: z.record(z.any()).optional(),
});

export const UpdateConfigurationSchema = CreateConfigurationSchema.partial();
