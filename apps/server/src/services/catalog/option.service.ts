import type { OptionCategory, ProductClassOptionCategory, OptionHeader, OptionDetails, OptionRule, OptionRuleTarget, OptionRuleTrigger } from "@prisma/client";

import type { IQueryParams } from "@/types";

import {
  optionCategoryRepository,
  productClassOptionCategoryRepository,
  optionHeaderRepository,
  optionDetailsRepository,
  optionRuleRepository,
  optionRuleTargetRepository,
  optionRuleTriggerRepository,
} from "@/repositories";

export class OptionService {
  async createOptionCategory(data: Partial<OptionCategory>) {
    return optionCategoryRepository.create(data);
  }

  async updateOptionCategory(id: string, data: Partial<OptionCategory>) {
    return optionCategoryRepository.update(id, data);
  }

  async deleteOptionCategory(id: string) {
    return optionCategoryRepository.delete(id);
  }

  async getAllOptionCategories(params?: IQueryParams<OptionCategory>) {
    return optionCategoryRepository.getAll(params);
  }

  async getOptionCategoryById(id: string, params?: IQueryParams<OptionCategory>) {
    return optionCategoryRepository.getById(id, params);
  }

  async createPCOC(data: Partial<ProductClassOptionCategory>) {
    return productClassOptionCategoryRepository.create(data);
  }

  async updatePCOC(id: string, data: Partial<ProductClassOptionCategory>) {
    return productClassOptionCategoryRepository.update(id, data);
  }

  async deletePCOC(id: string) {
    return productClassOptionCategoryRepository.delete(id);
  }

  async getAllPCOCs(params?: IQueryParams<ProductClassOptionCategory>) {
    return productClassOptionCategoryRepository.getAll(params);
  }

  async getPCOCById(id: string, params?: IQueryParams<ProductClassOptionCategory>) {
    return productClassOptionCategoryRepository.getById(id, params);
  }

  async createOptionHeader(data: Partial<OptionHeader>) {
    return optionHeaderRepository.create(data);
  }

  async updateOptionHeader(id: string, data: Partial<OptionHeader>) {
    return optionHeaderRepository.update(id, data);
  }

  async deleteOptionHeader(id: string) {
    return optionHeaderRepository.delete(id);
  }

  async getAllOptionHeaders(params?: IQueryParams<OptionHeader>) {
    return optionHeaderRepository.getAll(params);
  }

  async getOptionHeaderById(id: string, params?: IQueryParams<OptionHeader>) {
    return optionHeaderRepository.getById(id, params);
  }

  async createOptionDetail(data: Partial<OptionDetails>) {
    return optionDetailsRepository.create(data);
  }

  async updateOptionDetail(id: string, data: Partial<OptionDetails>) {
    return optionDetailsRepository.update(id, data);
  }

  async deleteOptionDetail(id: string) {
    return optionDetailsRepository.delete(id);
  }

  async getAllOptionDetails(params?: IQueryParams<OptionDetails>) {
    return optionDetailsRepository.getAll(params);
  }

  async getOptionDetailById(id: string, params?: IQueryParams<OptionDetails>) {
    return optionDetailsRepository.getById(id, params);
  }

  async createOptionRule(data: Partial<OptionRule>) {
    return optionRuleRepository.create(data);
  }

  async updateOptionRule(id: string, data: Partial<OptionRule>) {
    return optionRuleRepository.update(id, data);
  }

  async deleteOptionRule(id: string) {
    return optionRuleRepository.delete(id);
  }

  async getAllOptionRules(params?: IQueryParams<OptionRule>) {
    return optionRuleRepository.getAll(params);
  }

  async getOptionRuleById(id: string, params?: IQueryParams<OptionRule>) {
    return optionRuleRepository.getById(id, params);
  }

  async createOptionRuleTarget(data: Partial<OptionRuleTarget>) {
    return optionRuleTargetRepository.create(data);
  }

  async updateOptionRuleTarget(id: string, data: Partial<OptionRuleTarget>) {
    return optionRuleTargetRepository.update(id, data);
  }

  async deleteOptionRuleTarget(id: string) {
    return optionRuleTargetRepository.delete(id);
  }

  async getAllOptionRuleTargets(params?: IQueryParams<OptionRuleTarget>) {
    return optionRuleTargetRepository.getAll(params);
  }

  async getOptionRuleTargetById(id: string, params?: IQueryParams<OptionRuleTarget>) {
    return optionRuleTargetRepository.getById(id, params);
  }

  async createOptionRuleTrigger(data: Partial<OptionRuleTrigger>) {
    return optionRuleTriggerRepository.create(data);
  }

  async updateOptionRuleTrigger(id: string, data: Partial<OptionRuleTrigger>) {
    return optionRuleTriggerRepository.update(id, data);
  }

  async deleteOptionRuleTrigger(id: string) {
    return optionRuleTriggerRepository.delete(id);
  }

  async getAllOptionRuleTriggers(params?: IQueryParams<OptionRuleTrigger>) {
    return optionRuleTriggerRepository.getAll(params);
  }

  async getOptionRuleTriggerById(id: string, params?: IQueryParams<OptionRuleTrigger>) {
    return optionRuleTriggerRepository.getById(id, params);
  }
}
