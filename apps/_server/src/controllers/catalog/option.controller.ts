import type { OptionCategory, OptionDetails, OptionHeader, OptionRule, OptionRuleTarget, OptionRuleTrigger, ProductClassOptionCategory } from "@prisma/client";
import type { Request, Response } from "express";

import { OptionRuleAction } from "@prisma/client";
import { z } from "zod";

import { optionService } from "@/services";
import { asyncWrapper, buildQueryParams } from "@/utils";
import { HTTP_STATUS } from "@/utils/constants";

const CreateOptionCategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  multiple: z.boolean().default(false),
  mandatory: z.boolean().default(false),
  legacy: z.record(z.any()).optional(),
});

const UpdateOptionCategorySchema = CreateOptionCategorySchema.partial();

const CreatePCOCSchema = z.object({
  productClassId: z.string().uuid("Invalid product class ID"),
  optionCategoryId: z.string().uuid("Invalid option category ID"),
  displayOrder: z.number().int().default(0),
  isRequired: z.boolean().default(false),
});

const UpdatePCOCSchema = CreatePCOCSchema.partial();

const CreateOptionHeaderSchema = z.object({
  optionCategoryId: z.string().uuid("Invalid option category ID"),
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  legacyId: z.string().optional(),
});

const UpdateOptionHeaderSchema = CreateOptionHeaderSchema.partial();

const CreateOptionDetailSchema = z.object({
  optionHeaderId: z.string().uuid("Invalid option header ID"),
  productClassId: z.string().uuid("Invalid product class ID").optional(),
  itemId: z.string().uuid("Invalid item ID").optional(),
  price: z.union([z.number(), z.string()]).transform(val => val),
});

const UpdateOptionDetailSchema = CreateOptionDetailSchema.partial();

const CreateOptionRuleSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  action: z.nativeEnum(OptionRuleAction),
  priority: z.number().int().default(0),
  condition: z.record(z.any()),
});

const UpdateOptionRuleSchema = CreateOptionRuleSchema.partial();

const CreateOptionRuleTargetSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID"),
  optionId: z.string().uuid("Invalid option ID"),
});

const UpdateOptionRuleTargetSchema = CreateOptionRuleTargetSchema.partial();

const CreateOptionRuleTriggerSchema = z.object({
  ruleId: z.string().uuid("Invalid rule ID"),
  optionId: z.string().uuid("Invalid option ID"),
});

const UpdateOptionRuleTriggerSchema = CreateOptionRuleTriggerSchema.partial();

export class OptionController {
  createOptionCategory = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionCategorySchema.parse(req.body);
    const result = await optionService.createOptionCategory(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionCategories = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionCategory>(req.query);
    const result = await optionService.getAllOptionCategories(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionCategory = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionCategoryById(req.params.optionCategoryId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionCategory = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionCategorySchema.parse(req.body);
    const result = await optionService.updateOptionCategory(req.params.optionCategoryId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionCategory = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionCategory(req.params.optionCategoryId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createPCOC = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreatePCOCSchema.parse(req.body);
    const result = await optionService.createPCOC(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getPCOCs = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<ProductClassOptionCategory>(req.query);
    const result = await optionService.getAllPCOCs(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getPCOC = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getPCOCById(req.params.pcocId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updatePCOC = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdatePCOCSchema.parse(req.body);
    const result = await optionService.updatePCOC(req.params.pcocId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deletePCOC = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deletePCOC(req.params.pcocId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createOptionHeader = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionHeaderSchema.parse(req.body);
    const result = await optionService.createOptionHeader(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionHeaders = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionHeader>(req.query);
    const result = await optionService.getAllOptionHeaders(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionHeader = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionHeaderById(req.params.optionHeaderId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionHeader = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionHeaderSchema.parse(req.body);
    const result = await optionService.updateOptionHeader(req.params.optionHeaderId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionHeader = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionHeader(req.params.optionHeaderId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createOptionDetail = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionDetailSchema.parse(req.body);
    const result = await optionService.createOptionDetail(validData as any);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionDetails = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionDetails>(req.query);
    const result = await optionService.getAllOptionDetails(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionDetail = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionDetailById(req.params.optionDetailId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionDetail = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionDetailSchema.parse(req.body);
    const result = await optionService.updateOptionDetail(req.params.optionDetailId, validData as any);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionDetail = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionDetail(req.params.optionDetailId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createOptionRule = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionRuleSchema.parse(req.body);
    const result = await optionService.createOptionRule(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionRules = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionRule>(req.query);
    const result = await optionService.getAllOptionRules(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionRule = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionRuleById(req.params.optionRuleId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionRule = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionRuleSchema.parse(req.body);
    const result = await optionService.updateOptionRule(req.params.optionRuleId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionRule = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionRule(req.params.optionRuleId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createOptionRuleTarget = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionRuleTargetSchema.parse(req.body);
    const result = await optionService.createOptionRuleTarget(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionRuleTargets = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionRuleTarget>(req.query);
    const result = await optionService.getAllOptionRuleTargets(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionRuleTarget = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionRuleTargetById(req.params.optionRuleTargetId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionRuleTarget = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionRuleTargetSchema.parse(req.body);
    const result = await optionService.updateOptionRuleTarget(req.params.optionRuleTargetId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionRuleTarget = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionRuleTarget(req.params.optionRuleTargetId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });

  createOptionRuleTrigger = asyncWrapper(async (req: Request, res: Response) => {
    const validData = CreateOptionRuleTriggerSchema.parse(req.body);
    const result = await optionService.createOptionRuleTrigger(validData);
    res.status(HTTP_STATUS.CREATED).json(result);
  });

  getOptionRuleTriggers = asyncWrapper(async (req: Request, res: Response) => {
    const params = buildQueryParams<OptionRuleTrigger>(req.query);
    const result = await optionService.getAllOptionRuleTriggers(params);
    res.status(HTTP_STATUS.OK).json(result);
  });

  getOptionRuleTrigger = asyncWrapper(async (req: Request, res: Response) => {
    const result = await optionService.getOptionRuleTriggerById(req.params.optionRuleTriggerId);
    res.status(HTTP_STATUS.OK).json(result);
  });

  updateOptionRuleTrigger = asyncWrapper(async (req: Request, res: Response) => {
    const validData = UpdateOptionRuleTriggerSchema.parse(req.body);
    const result = await optionService.updateOptionRuleTrigger(req.params.optionRuleTriggerId, validData);
    res.status(HTTP_STATUS.OK).json(result);
  });

  deleteOptionRuleTrigger = asyncWrapper(async (req: Request, res: Response) => {
    await optionService.deleteOptionRuleTrigger(req.params.optionRuleTriggerId);
    res.status(HTTP_STATUS.NO_CONTENT).send();
  });
}
