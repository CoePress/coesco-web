/**
 * Autofill Trigger Service
 *
 * Determines which fields trigger autofill calculations for which visible tabs
 * and manages the priority-based field population strategy.
 * (Migrated from client to server)
 */

import type { PerformanceData } from "../types/performance-data.types";
import type { VisibleTab } from "../utils/tab-visibility";

import { getVisibleTabs } from "../utils/tab-visibility";
import { ValidationAwareAutofillService } from "./validation-aware-autofill.service";

export interface AutofillTriggerMapping {
  fieldName: string;
  triggersFor: string[]; // Tab names that should be calculated
  priority: number; // Higher = more important
  requiresMinimumData?: string[]; // Other fields that must be present
}

export interface AutofillStrategy {
  immediate: string[]; // Tabs to fill immediately
  conditional: string[]; // Tabs to fill if conditions met
  calculated: string[]; // Tabs requiring backend calculations
}

export class AutofillTriggerService {
  /**
   * Define which fields trigger autofill for which sections
   */
  private static readonly AUTOFILL_TRIGGERS: AutofillTriggerMapping[] = [
    // Material specifications (highest priority - triggers most calculations)
    {
      fieldName: "common.material.materialType",
      triggersFor: ["rfq", "material-specs", "summary-report", "roll-str-backbend", "str-utility", "feed", "reel-drive", "tddbhd"],
      priority: 100,
      requiresMinimumData: ["common.material.materialThickness"],
    },
    {
      fieldName: "common.material.materialThickness",
      triggersFor: ["material-specs", "roll-str-backbend", "str-utility", "feed", "shear"],
      priority: 95,
      requiresMinimumData: ["common.material.materialType"],
    },
    {
      fieldName: "common.material.maxYieldStrength",
      triggersFor: ["material-specs", "roll-str-backbend", "str-utility", "shear"],
      priority: 90,
    },
    {
      fieldName: "common.material.coilWidth",
      triggersFor: ["material-specs", "summary-report", "feed", "reel-drive", "tddbhd"],
      priority: 85,
    },

    // Configuration fields that drive tab visibility (critical for proper autofill)
    {
      fieldName: "feed.feed.application",
      triggersFor: ["rfq", "feed", "str-utility", "tddbhd", "reel-drive", "shear"],
      priority: 95,
      requiresMinimumData: [],
    },
    {
      fieldName: "common.equipment.feed.lineType",
      triggersFor: ["rfq", "str-utility", "reel-drive", "tddbhd"],
      priority: 90,
      requiresMinimumData: [],
    },
    {
      fieldName: "common.equipment.feed.typeOfLine",
      triggersFor: ["rfq", "str-utility", "reel-drive", "shear"],
      priority: 88,
      requiresMinimumData: [],
    },
    {
      fieldName: "feed.feed.pullThru.isPullThru",
      triggersFor: ["reel-drive", "summary-report"],
      priority: 85,
      requiresMinimumData: [],
    },
    {
      fieldName: "common.equipment.feed.controlsLevel",
      triggersFor: ["feed", "str-utility"],
      priority: 80,
      requiresMinimumData: [],
    },
    {
      fieldName: "materialSpecs.feed.controls",
      triggersFor: ["feed"],
      priority: 75,
      requiresMinimumData: [],
    },
    {
      fieldName: "materialSpecs.straightener.rolls.typeOfRoll",
      triggersFor: ["roll-str-backbend"],
      priority: 90,
      requiresMinimumData: ["common.material.materialThickness", "common.material.maxYieldStrength"],
    },

    // Equipment models (high priority - determines calculations available)
    {
      fieldName: "common.equipment.straightener.model",
      triggersFor: ["str-utility", "roll-str-backbend"],
      priority: 85,
    },
    {
      fieldName: "common.equipment.feed.model",
      triggersFor: ["feed"],
      priority: 80,
    },
    {
      fieldName: "common.equipment.reel.model",
      triggersFor: ["reel-drive", "tddbhd"],
      priority: 75,
    },

    // Feed rates and operations
    {
      fieldName: "common.feedRates.average.length",
      triggersFor: ["feed", "str-utility"],
      priority: 80,
    },
    {
      fieldName: "common.feedRates.average.spm",
      triggersFor: ["feed", "str-utility", "reel-drive"],
      priority: 75,
    },

    // Coil specifications
    {
      fieldName: "common.coil.maxCoilWeight",
      triggersFor: ["material-specs", "summary-report", "reel-drive", "tddbhd"],
      priority: 55,
    },
    {
      fieldName: "common.coil.maxCoilOD",
      triggersFor: ["material-specs", "summary-report", "reel-drive", "tddbhd"],
      priority: 50,
    },
  ];

  /**
   * Get tabs that should be auto-filled when a specific field changes
   */
  public static getTriggeredTabs(fieldName: string, data: PerformanceData): string[] {
    // Find all trigger mappings for this field
    const triggers = this.AUTOFILL_TRIGGERS.filter(trigger =>
      trigger.fieldName === fieldName,
    );

    if (triggers.length === 0)
      return [];

    // Get currently visible tabs
    const visibleTabs = getVisibleTabs(data);
    const visibleTabNames = visibleTabs.map(tab => tab.value);

    // Collect all triggered tabs that are currently visible
    const triggeredTabs = new Set<string>();

    for (const trigger of triggers) {
      // Check if minimum required data is present
      if (trigger.requiresMinimumData) {
        const hasRequiredData = trigger.requiresMinimumData.every((requiredField) => {
          const value = this.getNestedValue(data, requiredField);
          return this.hasMeaningfulValue(value);
        });

        if (!hasRequiredData)
          continue;
      }

      // Add triggered tabs that are visible
      trigger.triggersFor.forEach((tabName) => {
        if (visibleTabNames.includes(tabName)) {
          triggeredTabs.add(tabName);
        }
      });
    }

    return Array.from(triggeredTabs);
  }

  /**
   * Get autofill strategy for a field change
   */
  public static getAutofillStrategy(fieldName: string, data: PerformanceData): AutofillStrategy {
    const triggeredTabs = this.getTriggeredTabs(fieldName, data);

    // Categorize tabs by autofill approach
    const strategy: AutofillStrategy = {
      immediate: [],
      conditional: [],
      calculated: [],
    };

    for (const tabName of triggeredTabs) {
      switch (tabName) {
        case "rfq":
        case "summary-report":
          // RFQ and summary can be filled immediately with defaults
          strategy.immediate.push(tabName);
          break;

        case "material-specs":
          // Material specs can often be filled immediately with calculated values
          strategy.calculated.push(tabName);
          break;

        case "roll-str-backbend":
        case "str-utility":
        case "feed":
        case "reel-drive":
        case "tddbhd":
        case "shear":
          // These require backend calculations
          strategy.calculated.push(tabName);
          break;

        default:
          strategy.conditional.push(tabName);
      }
    }

    return strategy;
  }

  /**
   * Check if field has sufficient data to trigger autofill
   */
  public static canTriggerAutofill(fieldName: string, data: PerformanceData): boolean {
    const triggers = this.AUTOFILL_TRIGGERS.filter(t => t.fieldName === fieldName);

    if (triggers.length === 0)
      return false;

    // Check if we have minimum data for any trigger
    return triggers.some((trigger) => {
      if (!trigger.requiresMinimumData)
        return true;

      return trigger.requiresMinimumData.every((requiredField) => {
        const value = this.getNestedValue(data, requiredField);
        return this.hasMeaningfulValue(value);
      });
    });
  }

  /**
   * Get priority of field for autofill triggering
   */
  public static getFieldPriority(fieldName: string): number {
    const triggers = this.AUTOFILL_TRIGGERS.filter(t => t.fieldName === fieldName);
    return triggers.length > 0 ? Math.max(...triggers.map(t => t.priority)) : 0;
  }

  /**
   * Get all high-priority trigger fields
   */
  public static getHighPriorityFields(): string[] {
    return this.AUTOFILL_TRIGGERS
      .filter(trigger => trigger.priority >= 70)
      .map(trigger => trigger.fieldName);
  }

  /**
   * Check if current data has sufficient information for comprehensive autofill
   */
  public static hasSufficientDataForAutofill(data: PerformanceData): boolean {
    // Basic material specifications - handle both string and number types
    const materialType = data?.common?.material?.materialType;
    const materialThickness = data?.common?.material?.materialThickness;
    const maxYieldStrength = data?.common?.material?.maxYieldStrength;
    const coilWidth = data?.common?.material?.coilWidth;

    const hasMaterialSpecs
      = this.hasMeaningfulValue(materialType)
        && this.hasMeaningfulValue(materialThickness)
        && this.hasMeaningfulValue(maxYieldStrength);

    // Basic dimensions
    const hasDimensions = this.hasMeaningfulValue(coilWidth);

    // Application is selected
    const hasApplication = this.hasMeaningfulValue(data?.feed?.feed?.application);

    // At least one equipment model or basic configuration
    const hasEquipmentModel
      = this.hasMeaningfulValue(data?.common?.equipment?.straightener?.model)
        || this.hasMeaningfulValue(data?.common?.equipment?.feed?.model)
        || this.hasMeaningfulValue(data?.common?.equipment?.reel?.model)
        || this.hasMeaningfulValue(data?.common?.equipment?.feed?.lineType);

    // Sufficient data for autofill if we have material specs + dimensions + (application OR equipment)
    return hasMaterialSpecs && hasDimensions && (hasApplication || hasEquipmentModel);
  }

  /**
   * Get suggested autofill fields for empty required fields
   */
  public static getSuggestedAutofillFields(data: PerformanceData, visibleTabs: VisibleTab[]): Record<string, any> {
    // Use validation-aware autofill for comprehensive suggestions
    return ValidationAwareAutofillService.getValidationAwareAutofill(data, visibleTabs);
  }

  /**
   * Helper: Get nested value from object using dot notation
   */
  public static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Helper: Check if value is meaningful (not empty/default)
   */
  public static hasMeaningfulValue(value: any): boolean {
    if (value === null || value === undefined || value === "") {
      return false;
    }

    // Handle string numbers - convert to number for validation
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();

      // Check for selection prompts
      if (lowerValue.includes("select")
        || lowerValue.includes("choose")
        || lowerValue.includes("default")
        || lowerValue === "none") {
        return false;
      }

      // Check if it's a numeric string
      const numericValue = Number.parseFloat(value);
      if (!isNaN(numericValue)) {
        return numericValue > 0; // Numeric strings are meaningful if > 0
      }

      // Non-numeric strings are meaningful if not empty
      return value.trim().length > 0;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    // Boolean values and other types are always meaningful
    return true;
  }
}
