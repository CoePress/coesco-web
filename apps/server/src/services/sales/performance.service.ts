import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { performanceSheetLinkRepository, performanceSheetRepository, performanceSheetVersionRepository } from "@/repositories";

export class PerformanceService {
  // Versions
  async createPerformanceSheetVersion(data: Partial<PerformanceSheetVersion>) {
    return performanceSheetVersionRepository.create(data);
  }

  async updatePerformanceSheetVersion(id: string, data: Partial<PerformanceSheetVersion>) {
    return performanceSheetVersionRepository.update(id, data);
  }

  async deletePerformanceSheetVersion(id: string) {
    return performanceSheetVersionRepository.delete(id);
  }

  async getAllPerformanceSheetVersions(params?: IQueryParams<PerformanceSheetVersion>) {
    return performanceSheetVersionRepository.getAll(params);
  }

  async getPerformanceSheetVersionById(id: string, params?: IQueryParams<PerformanceSheetVersion>) {
    return performanceSheetVersionRepository.getById(id, params);
  }

  // Sheets
  async createPerformanceSheet(data: Partial<PerformanceSheet>) {
    return performanceSheetRepository.create(data);
  }

  async updatePerformanceSheet(id: string, data: Partial<PerformanceSheet>) {
    return performanceSheetRepository.update(id, data);
  }

  async deletePerformanceSheet(id: string) {
    return performanceSheetRepository.delete(id);
  }

  async getAllPerformanceSheets(params?: IQueryParams<PerformanceSheet>) {
    return performanceSheetRepository.getAll(params);
  }

  async getPerformanceSheetById(id: string, params?: IQueryParams<PerformanceSheet>) {
    return performanceSheetRepository.getById(id, params);
  }

  // Links
  async createPerformanceSheetLink(data: Partial<PerformanceSheetLink>) {
    return performanceSheetLinkRepository.create(data);
  }

  async updatePerformanceSheetLink(id: string, data: Partial<PerformanceSheetLink>) {
    return performanceSheetLinkRepository.update(id, data);
  }

  async deletePerformanceSheetLink(id: string) {
    return performanceSheetLinkRepository.delete(id);
  }

  async getAllPerformanceSheetLinks(params?: IQueryParams<PerformanceSheetLink>) {
    return performanceSheetLinkRepository.getAll(params);
  }

  async getPerformanceSheetLinkById(id: string, params?: IQueryParams<PerformanceSheetLink>) {
    return performanceSheetLinkRepository.getById(id, params);
  }
}
