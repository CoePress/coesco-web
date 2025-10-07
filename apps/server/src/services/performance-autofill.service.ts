import { execSync } from 'child_process';
import path from 'path';
import { transformDataForCalculationEngine, debugTransformation } from '../utils/data-transformer';

/**
 * Performance Sheet Auto-Fill Service
 * 
 * This service handles the logic for automatically filling performance sheets
 * with minimum valid values when sufficient user data is available.
 */
export class PerformanceAutoFillService {

    /**
     * Determines if sufficient data exists to trigger auto-fill
     * Based on key fields that are required for calculations
     */
    static hasSufficientData(data: any): boolean {
        // Check for basic material specifications (highest priority)
        const hasMaterialSpecs = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness &&
            data.common?.material?.maxYieldStrength);

        // Check for basic dimensions
        const hasDimensions = !!data.common?.material?.coilWidth;

        // Check for basic feed rates (at least one)
        const hasFeedRates = !!(data.common?.feedRates?.average?.length &&
            data.common?.feedRates?.average?.spm);

        // Minimum requirements: material specs + dimensions + feed rates
        const result = hasMaterialSpecs && hasDimensions && hasFeedRates;

        return result;
    }

    /**
     * Checks if specific tab has sufficient data for auto-fill
     */
    static hasTabSufficientData(data: any, tabName: string): boolean {
        switch (tabName) {
            case 'rfq':
                return this.hasRfqSufficientData(data);
            case 'material-specs':
                return this.hasMaterialSpecsSufficientData(data);
            case 'tddbhd':
                return this.hasTddbhdSufficientData(data);
            case 'reel-drive':
                return this.hasReelDriveSufficientData(data);
            case 'str-utility':
                return this.hasStrUtilitySufficientData(data);
            case 'feed':
                return this.hasFeedSufficientData(data);
            case 'shear':
                return this.hasShearSufficientData(data);
            default:
                return false;
        }
    }

    /**
     * RFQ tab validation - needs basic project info and material specs
     */
    private static hasRfqSufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasBasicInfo = !!(data.rfqDetails?.customerName || data.rfqDetails?.projectName);

        return hasMaterial && hasBasicInfo;
    }

    /**
     * Material Specs tab validation - needs material type and thickness
     */
    private static hasMaterialSpecsSufficientData(data: any): boolean {
        return !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness &&
            data.common?.material?.maxYieldStrength);
    }

    /**
     * TDDBHD tab validation - needs material specs and coil data
     */
    private static hasTddbhdSufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasCoil = !!(data.common?.coil?.coilWidth ||
            data.common?.material?.coilWidth);

        return hasMaterial && hasCoil;
    }

    /**
     * Reel Drive tab validation - needs material and reel configuration
     */
    private static hasReelDriveSufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasReelConfig = !!(data.reelDrive?.reel?.model ||
            data.common?.equipment?.reel?.model);

        return hasMaterial && hasReelConfig;
    }

    /**
     * Straightener Utility tab validation - needs material data
     */
    private static hasStrUtilitySufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasStraightener = !!data.common?.equipment?.straightener?.model;

        return hasMaterial && hasStraightener;
    }

    /**
     * Feed tab validation - needs material and feed equipment data
     */
    private static hasFeedSufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasFeedEquipment = !!data.common?.equipment?.feed?.model;

        return hasMaterial && hasFeedEquipment;
    }

    /**
     * Shear tab validation - needs material data for shear calculations
     */
    private static hasShearSufficientData(data: any): boolean {
        const hasMaterial = !!(data.common?.material?.materialType &&
            data.common?.material?.materialThickness);
        const hasYieldStrength = !!(data.common?.material?.maxYieldStrength ||
            data.common?.material?.yieldStrength);

        return hasMaterial && hasYieldStrength;
    }

    /**
     * Determines which tabs can be auto-filled based on available data
     */
    static getAutoFillableTabs(data: any): string[] {
        const tabs: string[] = [];
        const allTabs = ['rfq', 'material-specs', 'tddbhd', 'reel-drive', 'str-utility', 'feed', 'shear'];

        // Check each tab individually using the specific validation methods
        for (const tabName of allTabs) {
            if (this.hasTabSufficientData(data, tabName)) {
                tabs.push(tabName);
            }
        }

        return tabs;
    }

    /**
     * Generates minimum valid values for all auto-fillable tabs
     * Uses the existing Python calculation engine to find values that pass all checks
     */
    static async generateAutoFillValues(inputData: any): Promise<any> {
        try {
            // Transform data for Python calculation engine (convert strings to numbers)
            const transformedData = transformDataForCalculationEngine(inputData);
            debugTransformation(inputData, transformedData);

            const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'performance-sheet', 'autofill.py');
            const inputJson = JSON.stringify(transformedData);

            // Execute the Python auto-fill script
            const result = execSync(`python "${scriptPath}"`, {
                input: inputJson,
                encoding: 'utf-8',
                cwd: path.join(process.cwd(), 'src', 'scripts', 'performance-sheet'),
                timeout: 30000, // 30 second timeout
                stdio: ['pipe', 'pipe', 'inherit'] // Inherit stderr to see debug logs
            });

            // Parse the JSON output from the Python script
            const autoFillResults = JSON.parse(result);

            return {
                success: true,
                autoFillValues: autoFillResults,
                fillableTabs: this.getAutoFillableTabs(inputData),
                metadata: {
                    generatedAt: new Date().toISOString(),
                    hasSufficientData: this.hasSufficientData(inputData)
                }
            };

        } catch (error) {
            console.error('Error in auto-fill generation:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                autoFillValues: null,
                fillableTabs: [],
                metadata: {
                    generatedAt: new Date().toISOString(),
                    hasSufficientData: this.hasSufficientData(inputData)
                }
            };
        }
    }

    /**
     * Merges auto-fill values with existing data based on priority rules
     * Higher priority fields (models, higher on page) take precedence
     */
    static mergeAutoFillValues(existingData: any, autoFillValues: any, options: {
        preserveUserInput?: boolean;
        prioritizeModels?: boolean;
    } = {}): any {
        const { preserveUserInput = true, prioritizeModels = true } = options;

        // Deep clone existing data to avoid mutations
        const mergedData = JSON.parse(JSON.stringify(existingData));

        // Define field priority order (higher index = higher priority)
        const fieldPriority = this.getFieldPriority();

        // Apply auto-fill values based on priority
        this.applyAutoFillValuesByPriority(mergedData, autoFillValues, fieldPriority, {
            preserveUserInput,
            prioritizeModels
        });

        return mergedData;
    }

    /**
     * Defines field priority based on visual position and importance
     * Higher values indicate higher priority
     */
    private static getFieldPriority(): Record<string, number> {
        return {
            // Models have highest priority (100-200 range)
            'common.equipment.straightener.model': 150,
            'common.equipment.feed.model': 140,
            'tddbhd.reel.model': 130,
            'reelDrive.reel.model': 120,
            'shear.type': 110,

            // Material specs (80-99 range) - high priority as they're at top of forms
            'common.material.materialType': 95,
            'common.material.materialThickness': 90,
            'common.material.maxYieldStrength': 85,
            'common.material.coilWidth': 80,

            // Equipment dimensions (60-79 range)
            'common.equipment.straightener.width': 75,
            'common.equipment.feed.width': 70,
            'tddbhd.reel.width': 65,
            'reelDrive.reel.width': 60,

            // Operating parameters (40-59 range)
            'strUtility.straightener.horsepower': 55,
            'strUtility.straightener.feedRate': 50,
            'feed.feed.accelerationRate': 45,
            'shear.hydraulic.pressure': 40,

            // Calculated/derived values (20-39 range)
            'common.feedRates.average.fpm': 35,
            'common.feedRates.min.fpm': 30,
            'common.feedRates.max.fpm': 25,

            // Default priority for unspecified fields
            '*': 10
        };
    }

    /**
     * Applies auto-fill values based on field priority
     */
    private static applyAutoFillValuesByPriority(
        targetData: any,
        autoFillValues: any,
        fieldPriority: Record<string, number>,
        options: { preserveUserInput: boolean; prioritizeModels: boolean }
    ): void {
        const { preserveUserInput, prioritizeModels } = options;

        // Get all auto-fill paths sorted by priority
        const autoFillPaths = this.getAllNestedPaths(autoFillValues);
        const sortedPaths = autoFillPaths.sort((a, b) => {
            const priorityA = fieldPriority[a] || fieldPriority['*'];
            const priorityB = fieldPriority[b] || fieldPriority['*'];
            return priorityB - priorityA; // Higher priority first
        });

        // Apply values in priority order
        for (const path of sortedPaths) {
            const value = this.getNestedValue(autoFillValues, path);
            if (value !== undefined && value !== null) {
                // Check if user input should be preserved
                if (preserveUserInput && this.hasUserInput(targetData, path)) {
                    continue; // Skip if user has already entered a value
                }

                // Apply the auto-fill value
                this.setNestedValue(targetData, path, value);
            }
        }
    }

    /**
     * Gets all nested paths in an object
     */
    private static getAllNestedPaths(obj: any, prefix: string = ''): string[] {
        const paths: string[] = [];

        for (const key in obj) {
            if (obj.hasOwnProperty(key)) {
                const path = prefix ? `${prefix}.${key}` : key;
                const value = obj[key];

                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    paths.push(...this.getAllNestedPaths(value, path));
                } else {
                    paths.push(path);
                }
            }
        }

        return paths;
    }

    /**
     * Gets a nested value from an object using dot notation
     */
    private static getNestedValue(obj: any, path: string): any {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }

    /**
     * Sets a nested value in an object using dot notation
     */
    private static setNestedValue(obj: any, path: string, value: any): void {
        const keys = path.split('.');
        const lastKey = keys.pop()!;

        const target = keys.reduce((current, key) => {
            if (!current[key]) {
                current[key] = {};
            }
            return current[key];
        }, obj);

        target[lastKey] = value;
    }

    /**
     * Checks if a field has user input (non-default, non-empty value)
     * Updated to properly handle 0 as valid user input
     */
    private static hasUserInput(data: any, path: string): boolean {
        const value = this.getNestedValue(data, path);

        // Consider these as "no user input"
        if (value === undefined || value === null || value === '') {
            return false;
        }

        // For numbers, 0 IS a valid user input (for lengths, SPMs, etc.)
        if (typeof value === 'number') {
            return true; // Any number (including 0) is considered user input
        }

        // For strings, check if it's a default placeholder
        if (typeof value === 'string' && (
            value.toLowerCase().includes('select') ||
            value.toLowerCase().includes('choose') ||
            value.toLowerCase().includes('default')
        )) {
            return false;
        }

        return true;
    }
}
