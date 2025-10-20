import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { performanceSheetLinkRepository, performanceSheetRepository, performanceSheetVersionRepository } from "@/repositories";
import { prisma } from "@/utils/prisma";

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

  private setNestedValue(obj: Record<string, any>, path: string, value: any): void {
    const keys = path.split(".");
    let current = obj;

    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!current[key] || typeof current[key] !== "object") {
        current[key] = {};
      }
      current = current[key];
    }

    current[keys[keys.length - 1]] = value;
  }

  // Sheets
  async createPerformanceSheet(data: Partial<PerformanceSheet>) {
    const { versionId, data: sheetData, ...rest } = data;

    if (!versionId) {
      return {
        success: false,
        message: "versionId is required",
      };
    }

    const versionResult = await performanceSheetVersionRepository.getById(versionId);

    if (!versionResult.success || !versionResult.data) {
      return {
        success: false,
        message: "Version not found",
      };
    }

    const version = versionResult.data;
    const initializedData: Record<string, any> = {};

    if (version.sections && Array.isArray(version.sections)) {
      (version.sections as any[]).forEach((section: any) => {
        if (section.sections && Array.isArray(section.sections)) {
          section.sections.forEach((subsection: any) => {
            if (subsection.fields && Array.isArray(subsection.fields)) {
              subsection.fields.forEach((field: any) => {
                const value = field.default !== undefined ? field.default : null;
                this.setNestedValue(initializedData, field.id, value);
              });
            }
          });
        }
      });
    }

    const mergedData = {
      ...initializedData,
      ...(sheetData && typeof sheetData === "object" && !Array.isArray(sheetData) ? sheetData : {}),
    };

    return performanceSheetRepository.create({
      ...rest,
      versionId,
      data: mergedData,
    });
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
    const result = await performanceSheetRepository.getById(id, params);

    if (result.success && result.data?.links) {
      const enrichedLinks = await Promise.all(
        result.data.links.map(async (link: any) => {
          const label = await this.getLabelForEntity(link.entityType, link.entityId);
          return { ...link, label };
        }),
      );
      result.data.links = enrichedLinks;
    }

    return result;
  }

  private async getLabelForEntity(entityType: string, entityId: string): Promise<string> {
    try {
      switch (entityType) {
        case "company": {
          const company = await prisma.company.findUnique({
            where: { id: entityId },
            select: { name: true },
          });
          return company?.name || entityId;
        }
        case "contact": {
          const contact = await prisma.contact.findUnique({
            where: { id: entityId },
            select: { firstName: true, lastName: true, company: { select: { name: true } } },
          });
          if (contact) {
            const fullName = `${contact.firstName} ${contact.lastName || ""}`.trim();
            return contact.company?.name ? `${fullName} (${contact.company.name})` : fullName;
          }
          return entityId;
        }
        case "journey": {
          const journey = await prisma.journey.findUnique({
            where: { id: entityId },
            select: { name: true, id: true },
          });
          return journey?.name || journey?.id || entityId;
        }
        case "quote": {
          const quote = await prisma.quote.findUnique({
            where: { id: entityId },
            select: { year: true, number: true },
          });
          if (quote) {
            return `${quote.year.slice(-2)}-${quote.number.padStart(5, "0")}`;
          }
          return entityId;
        }
        default:
          return entityId;
      }
    }
    catch (error) {
      console.error(`Error fetching label for ${entityType} ${entityId}:`, error);
      return entityId;
    }
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
