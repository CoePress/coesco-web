import type { Configuration, ConfigurationOption, Item, OptionCategory, OptionDetails, OptionHeader, OptionRule, OptionRuleTarget, OptionRuleTrigger, ProductClass, ProductClassOptionCategory } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";

import type { IQueryParams } from "@/types";

import { configurationOptionService, configurationService, itemService, optionCategoryService, optionDetailsService, optionHeaderService, optionRuleService, optionRuleTargetService, optionRuleTriggerService, productClassOptionCategoryService, productClassService } from "@/services/repository";

export class ConfigurationController {
  // Items
  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getItems(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Item> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Item>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await itemService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await itemService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Product Classes
  async createProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getProductClasses(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<ProductClass> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<ProductClass>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await productClassService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteProductClass(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Categories
  async createOptionCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionCategoryService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionCategory> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionCategory>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionCategoryService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionCategoryService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionCategoryService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionCategoryService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Product Class Option Categories
  async createPCOC(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassOptionCategoryService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPCOCs(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<ProductClassOptionCategory> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<ProductClassOptionCategory>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await productClassOptionCategoryService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getPCOC(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassOptionCategoryService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updatePCOC(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassOptionCategoryService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deletePCOC(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productClassOptionCategoryService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Headers
  async createOptionHeader(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionHeaderService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionHeaders(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionHeader> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionHeader>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionHeaderService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionHeader(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionHeaderService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionHeader(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionHeaderService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionHeader(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionHeaderService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Details
  async createOptionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionDetailsService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionsDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionDetails> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionDetails>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionDetailsService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionDetailsService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionDetailsService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionDetailsService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Rules
  async createOptionRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRules(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionRule> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionRule>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionRuleService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionRule(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Rule Targets
  async createOptionRuleTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTargetService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRuleTargets(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionRuleTarget> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionRuleTarget>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionRuleTargetService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRuleTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTargetService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionRuleTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTargetService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionRuleTarget(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTargetService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Option Rule Triggers
  async createOptionRuleTrigger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTriggerService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRuleTriggers(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<OptionRuleTrigger> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<OptionRuleTrigger>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await optionRuleTriggerService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getOptionRuleTrigger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTriggerService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateOptionRuleTrigger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTriggerService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteOptionRuleTrigger(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await optionRuleTriggerService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Configurations
  async createConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfigurations(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<Configuration> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<Configuration>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await configurationService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteConfiguration(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  // Configuration Options
  async createConfigurationOption(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationOptionService.create(req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfigurationOptions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page, limit, sort, order, search, filter, include } = req.query;
      const params: IQueryParams<ConfigurationOption> = {
        page: page ? Number.parseInt(page as string) : 1,
        limit: limit ? Number.parseInt(limit as string) : undefined,
        sort: sort as string,
        order: order as "asc" | "desc",
        search: search as string,
        filter: filter as Partial<ConfigurationOption>,
        include: include ? JSON.parse(include as string) : undefined,
      };
      const result = await configurationOptionService.getAll(params);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async getConfigurationOption(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationOptionService.getById(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async updateConfigurationOption(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationOptionService.update(req.params.companyId, req.body);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }

  async deleteConfigurationOption(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await configurationOptionService.delete(req.params.companyId);
      res.status(200).json(result);
    }
    catch (error) {
      next(error);
    }
  }
}
