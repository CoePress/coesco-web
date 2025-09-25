import { execSync } from 'child_process';
import path from 'path';

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
        const hasMaterialSpecs = data.common?.material?.materialType &&
            data.common?.material?.materialThickness &&
            data.common?.material?.maxYieldStrength;

        // Check for basic dimensions
        const hasDimensions = data.common?.material?.coilWidth;

        // Check for basic feed rates (at least one)
        const hasFeedRates = data.common?.feedRates?.average?.length &&
            data.common?.feedRates?.average?.spm;

        // Minimum requirements: material specs + dimensions + feed rates
        return hasMaterialSpecs && hasDimensions && hasFeedRates;
    }

    /**
     * Determines which tabs can be auto-filled based on available data
     */
    static getAutoFillableTabs(data: any): string[] {
        const tabs: string[] = [];

        // RFQ is always fillable if we have basic data
        if (this.hasSufficientData(data)) {
            tabs.push('rfq');
        }

        // Material Specs can be filled if we have material data
        if (data.common?.material?.materialType && data.common?.material?.materialThickness) {
            tabs.push('material-specs');
        }

        // TDDBHD can be filled if we have material specs and coil data
        if (data.common?.material && data.common?.coil) {
            tabs.push('tddbhd');
        }

        // Reel Drive can be filled if we have material and reel data
        if (data.common?.material && data.reelDrive?.reel) {
            tabs.push('reel-drive');
        }

        // Straightener Utility can be filled if we have material data
        if (data.common?.material) {
            tabs.push('str-utility');
        }

        // Feed can be filled if we have material and basic equipment data
        if (data.common?.material && data.common?.equipment) {
            tabs.push('feed');
        }

        // Shear can be filled if we have material data
        if (data.common?.material) {
            tabs.push('shear');
        }

        return tabs;
    }

    /**
     * Generates minimum valid values for all auto-fillable tabs
     * Uses the existing Python calculation engine to find values that pass all checks
     */
    static async generateAutoFillValues(inputData: any): Promise<any> {
        try {
            const scriptPath = path.join(process.cwd(), 'src', 'scripts', 'performance-sheet', 'autofill-simple.py');
            const inputJson = JSON.stringify(inputData);

            // Execute the Python auto-fill script
            const result = execSync(`python "${scriptPath}"`, {
                input: inputJson,
                encoding: 'utf-8',
                cwd: path.join(process.cwd(), 'src', 'scripts', 'performance-sheet'),
                timeout: 30000 // 30 second timeout
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
     */
    private static hasUserInput(data: any, path: string): boolean {
        const value = this.getNestedValue(data, path);

        // Consider these as "no user input"
        if (value === undefined || value === null || value === '' || value === 0) {
            return false;
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
