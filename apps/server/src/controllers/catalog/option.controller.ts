export class OptionController {
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
      const params = buildQueryParams<OptionCategory>(req.query);
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
      const params = buildQueryParams<ProductClassOptionCategory>(req.query);
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
      const params = buildQueryParams<OptionHeader>(req.query);
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

  async getOptionDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const params = buildQueryParams<OptionDetails>(req.query);
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
      const params = buildQueryParams<OptionRule>(req.query);
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
      const params = buildQueryParams<OptionRuleTarget>(req.query);
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
      const params = buildQueryParams<OptionRuleTrigger>(req.query);
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
}