/**
 * Autofill Data Transformer
 *
 * Transforms frontend form data (strings) to backend calculation format (numbers)
 * for autofill operations
 * (Migrated from client to server)
 */

import type { PerformanceData } from "../types/performance-data.types";

/**
 * Transforms form data for backend autofill calculations
 * Converts string numbers to actual numbers where expected by calculation engine
 */
export function transformDataForAutofill(data: PerformanceData): any {
  const transformedData = JSON.parse(JSON.stringify(data)); // Deep clone

  // Helper function to convert string numbers to numbers (int or float)
  const convertToNumber = (value: any, forceInteger = false): any => {
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = forceInteger ? Number.parseInt(value) : Number.parseFloat(value);
      return !isNaN(parsed) ? parsed : value;
    }
    return value;
  };

  // Helper function to recursively convert all numeric strings in an object
  const convertNumericFields = (obj: any, path = ""): void => {
    if (!obj || typeof obj !== "object")
      return;

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      if (typeof value === "object" && value !== null) {
        convertNumericFields(value, currentPath);
      }
      else if (typeof value === "string" && value.trim() !== "") {
        // Fields that should stay as strings (don't convert)
        const stringFields = [
          "typeOfRoll",
          "feedDirection",
          "materialType",
          "grade",
          "coating",
          "surfaceCondition",
          "edgeCondition",
          "typeOfLine",
          "passline",
          "date",
          "dates.date",
          "rfq.dates.date",
        ];

        // Skip conversion if this should remain a string
        const shouldStayString = stringFields.some(field =>
          key.includes(field) || currentPath.includes(field),
        );

        if (shouldStayString) {
          return;
        }

        // Fields that should be integers
        const integerFields = [
          "numberOfRolls",
          "quantity",
          "coilID",
          "shiftsPerDay",
          "daysPerWeek",
          "rollCount",
          "guideQuantity",
          "cylinderCount",
          "maxCoilOD",
          "maxCoilWidth",
          "minCoilWidth",
          "maxCoilWeight",
        ];

        const shouldBeInteger = integerFields.some(field =>
          key.includes(field) || currentPath.includes(field),
        );

        // Convert if it looks like a number
        const parsed = shouldBeInteger ? Number.parseInt(value) : Number.parseFloat(value);
        if (!isNaN(parsed)) {
          obj[key] = parsed;
        }
      }
    }
  };

  // Apply comprehensive numeric conversion
  convertNumericFields(transformedData);

  // Handle specific boolean conversions
  const convertBooleanField = (obj: any, path: string) => {
    const pathParts = path.split(".");
    let current = obj;
    for (let i = 0; i < pathParts.length - 1; i++) {
      if (!current[pathParts[i]])
        return;
      current = current[pathParts[i]];
    }
    const fieldName = pathParts[pathParts.length - 1];
    if (current[fieldName] === "true" || current[fieldName] === "false") {
      const oldValue = current[fieldName];
      current[fieldName] = current[fieldName] === "true";
    }
  };

  // Convert known boolean fields
  convertBooleanField(transformedData, "common.equipment.feed.nonMarking");
  convertBooleanField(transformedData, "common.equipment.feed.lightGuageNonMarking");
  convertBooleanField(transformedData, "rfq.coil.slitEdge");
  convertBooleanField(transformedData, "rfq.coil.millEdge");
  convertBooleanField(transformedData, "rfq.dies.progressiveDies");
  convertBooleanField(transformedData, "rfq.dies.transferDies");
  convertBooleanField(transformedData, "rfq.dies.blankingDies");

  return transformedData;
}

/**
 * Debug helper to show data transformation
 */
export function debugDataTransformation(originalData: PerformanceData): void {
  console.log("Data Transformation");
  console.log("Original data types:");

  const material = originalData.common?.material;
  if (material) {
    console.log(`materialThickness: ${material.materialThickness} (${typeof material.materialThickness})`);
    console.log(`maxYieldStrength: ${material.maxYieldStrength} (${typeof material.maxYieldStrength})`);
    console.log(`coilWidth: ${material.coilWidth} (${typeof material.coilWidth})`);
  }

  const transformedData = transformDataForAutofill(originalData);
  const transformedMaterial = transformedData.common?.material;

  if (transformedMaterial) {
    console.log("Transformed data types:");
    console.log(`materialThickness: ${transformedMaterial.materialThickness} (${typeof transformedMaterial.materialThickness})`);
    console.log(`maxYieldStrength: ${transformedMaterial.maxYieldStrength} (${typeof transformedMaterial.maxYieldStrength})`);
    console.log(`coilWidth: ${transformedMaterial.coilWidth} (${typeof transformedMaterial.coilWidth})`);
  }
}
