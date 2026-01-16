import type { PerformanceSheet, PerformanceSheetLink, PerformanceSheetVersion } from "@prisma/client";

import type { IQueryParams } from "@/types";

import { performanceSheetLinkRepository, performanceSheetRepository, performanceSheetVersionRepository } from "@/repositories";
import { logger } from "@/utils/logger";
import { prisma } from "@/utils/prisma";
import { spawn } from "child_process";
import * as path from "path";

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

  private hasNestedValue(obj: Record<string, any>, path: string): boolean {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (!current || typeof current !== "object" || !(key in current)) {
        return false;
      }
      current = current[key];
    }

    return true;
  }

  private getNestedValue(obj: Record<string, any>, path: string): any {
    const keys = path.split(".");
    let current = obj;

    for (const key of keys) {
      if (!current || typeof current !== "object" || !(key in current)) {
        return undefined;
      }
      current = current[key];
    }

    return current;
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
                // Only set the value if it hasn't been set already and has a default
                if (field.default !== undefined && !this.hasNestedValue(initializedData, field.id)) {
                  this.setNestedValue(initializedData, field.id, field.default);
                } else if (field.default === undefined && !this.hasNestedValue(initializedData, field.id)) {
                  // Only set null if no value exists yet
                  this.setNestedValue(initializedData, field.id, null);
                }
              });
            }
          });
        }
      });
    }

    // Set reference number to sheet name if available and not already set
    console.log('Creating performance sheet with data:');
    console.log('- rest.name:', rest.name);
    console.log('- has referenceNumber:', this.hasNestedValue(initializedData, "referenceNumber"));
    const currentReferenceNumber = this.getNestedValue(initializedData, "referenceNumber");
    console.log('- current referenceNumber value:', currentReferenceNumber);
    console.log('- initializedData before setting referenceNumber:', JSON.stringify(initializedData, null, 2));

    if (rest.name && (!this.hasNestedValue(initializedData, "referenceNumber") || currentReferenceNumber === null || currentReferenceNumber === "")) {
      this.setNestedValue(initializedData, "referenceNumber", rest.name);
      console.log('- set referenceNumber to:', rest.name);
    }

    console.log('- initializedData after setting referenceNumber:', JSON.stringify(initializedData, null, 2));

    const mergedData = {
      ...initializedData,
      ...(sheetData && typeof sheetData === "object" && !Array.isArray(sheetData) ? sheetData : {}),
    };

    console.log('- final mergedData:', JSON.stringify(mergedData, null, 2));

    return performanceSheetRepository.create({
      ...rest,
      versionId,
      data: mergedData,
    });
  }

  async updatePerformanceSheet(id: string, data: Partial<PerformanceSheet>) {
    try {
      // Update the sheet first
      const updateResult = await performanceSheetRepository.update(id, data);

      // If data was provided, run calculations
      if (data.data && typeof data.data === 'object') {
        logger.info(`Running calculations for performance sheet ${id}`);

        try {
          // Execute Python calculation script
          const calculationResults = await this.executePythonScript(data.data);
          console.log('RAW CALCULATION RESULTS:', JSON.stringify(calculationResults, null, 2));

          // Map results back to data structure using Python result mapping
          const mappedData = await this.mapCalculationResults(data.data, calculationResults);
          console.log('MAPPED DATA FPM VALUES:', {
            averageFpm: mappedData?.common?.feedRates?.average?.fpm,
            maxFpm: mappedData?.common?.feedRates?.max?.fpm,
            minFpm: mappedData?.common?.feedRates?.min?.fpm,
            minBendRadius: mappedData?.materialSpecs?.material?.minBendRadius
          });

          // Update the sheet with calculated values
          const finalResult = await performanceSheetRepository.update(id, {
            ...data,
            data: mappedData
          });

          logger.info(`Successfully completed calculations for performance sheet ${id}`);

          // Return just the calculated data for frontend consumption
          console.log('FINAL RESULT DATA CHECK:', {
            finalResultSuccess: finalResult.success,
            hasData: !!finalResult.data,
            hasDataData: !!(finalResult.data && finalResult.data.data),
            finalResultDataPreview: finalResult.data ? Object.keys(finalResult.data) : 'no data'
          });

          if (finalResult.success && finalResult.data && finalResult.data.data) {
            console.log('RETURNING FINAL RESULT DATA.DATA - FPM CHECK:', {
              averageFpm: finalResult.data.data?.common?.feedRates?.average?.fpm,
              maxFpm: finalResult.data.data?.common?.feedRates?.max?.fpm,
              minFpm: finalResult.data.data?.common?.feedRates?.min?.fpm
            });
            return finalResult.data.data; // Return the data field which contains PerformanceData
          }
          console.log('RETURNING MAPPED DATA FALLBACK - FPM CHECK:', {
            averageFpm: mappedData?.common?.feedRates?.average?.fpm,
            maxFpm: mappedData?.common?.feedRates?.max?.fpm,
            minFpm: mappedData?.common?.feedRates?.min?.fpm
          });
          return mappedData; // Fallback to mapped data

        } catch (calcError) {
          logger.error(`Calculation failed for performance sheet ${id}:`, calcError);
          // Return the data field from original update result even if calculations fail
          if (updateResult.success && updateResult.data && updateResult.data.data) {
            return updateResult.data.data; // Return the data field which contains PerformanceData
          }
          return data.data || {}; // Fallback to original data
        }
      }

      // Return the data field from update result for consistency
      if (updateResult.success && updateResult.data && updateResult.data.data) {
        return updateResult.data.data; // Return the data field which contains PerformanceData
      }
      return data.data || {}; // Fallback to original data

    } catch (error) {
      logger.error(`Error updating performance sheet ${id}:`, error);
      throw error;
    }
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
      logger.error(`Error fetching label for ${entityType} ${entityId}:`, error);
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

  private async executePythonScript(formData: Record<string, any>): Promise<any> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, "../../scripts/performance-sheet/main.py");
      const python = spawn("python", [scriptPath]);
      let outputData = "";
      let errorData = "";

      python.stdin.write(JSON.stringify(formData));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          logger.error(`Python script exited with code ${code}: ${errorData}`);
          reject(new Error(errorData || "Python script failed"));
        }
        else {
          try {
            const result = JSON.parse(outputData);
            resolve(result);
          }
          catch (err) {
            logger.error("Failed to parse Python script output:", outputData);
            reject(new Error("Invalid JSON output from Python script"));
          }
        }
      });

      python.on("error", (err) => {
        logger.error("Failed to start Python process:", err);
        reject(err);
      });
    });
  }

  private async mapCalculationResults(originalData: Record<string, any>, calculationResults: Record<string, any>): Promise<Record<string, any>> {
    return new Promise((resolve, reject) => {
      const scriptPath = path.join(__dirname, "../../scripts/performance-sheet/utils/result_mapping.py");
      const pythonScriptDir = path.join(__dirname, "../../scripts/performance-sheet").replace(/\\/g, '/');
      const python = spawn("python", ["-c", `
import sys
import json
sys.path.append('${pythonScriptDir}')
from utils.result_mapping import map_calculation_results_to_data_structure

# Read input from stdin
input_data = json.loads(sys.stdin.read())
original_data = input_data['originalData']
calculation_results = input_data['calculationResults']

# Map results
mapped_data = map_calculation_results_to_data_structure(original_data, calculation_results)

# Output result
print(json.dumps(mapped_data, default=str))
      `]);

      let outputData = "";
      let errorData = "";

      const inputData = {
        originalData,
        calculationResults
      };

      python.stdin.write(JSON.stringify(inputData));
      python.stdin.end();

      python.stdout.on("data", (data) => {
        outputData += data.toString();
      });

      python.stderr.on("data", (data) => {
        errorData += data.toString();
      });

      python.on("close", (code) => {
        if (code !== 0) {
          logger.error(`Result mapping script exited with code ${code}: ${errorData}`);
          reject(new Error(errorData || "Result mapping failed"));
        }
        else {
          try {
            const result = JSON.parse(outputData);
            resolve(result);
          }
          catch (err) {
            logger.error("Failed to parse result mapping output:", outputData);
            reject(new Error("Invalid JSON output from result mapping"));
          }
        }
      });

      python.on("error", (err) => {
        logger.error("Failed to start result mapping process:", err);
        reject(err);
      });
    });
  }
}
