/**
 * Performance-related constants to eliminate code duplication
 */

// Type for all possible field paths in the performance data structure
export type FieldPath =
    // RFQ fields
    | 'rfq.coil.slitEdge' | 'rfq.coil.millEdge' | 'rfq.dies.transferDies'
    | 'rfq.dies.progressiveDies' | 'rfq.dies.blankingDies'
    // Feed fields
    | 'feed.feed.feedCheck' | 'feed.feed.match'
    | 'feed.feed.torque.peakCheck' | 'feed.feed.torque.rms.feedAngle1Check'
    | 'feed.feed.torque.rms.feedAngle2Check' | 'feed.feed.torque.accelerationCheck'
    // Common fields with dot notation
    | `common.${string}` | `rfq.${string}` | `feed.${string}` | string;

// Required checkbox fields that must be validated
export const REQUIRED_CHECKBOX_FIELDS: readonly FieldPath[] = [
    'rfq.coil.slitEdge',
    'rfq.coil.millEdge',
    'rfq.dies.transferDies',
    'rfq.dies.progressiveDies',
    'rfq.dies.blankingDies'
] as const;

// Debounce delays for different operations
export const DEBOUNCE_DELAYS = {
    CALCULATION: 100,   // Fast for real-time calculations
    SAVE: 1500,         // Slower for persistence
    SEARCH: 300,        // Standard for search inputs
    FIELD_VALIDATION: 150 // Quick validation feedback
} as const;

// Status check values
export const STATUS_VALUES = {
    OK: 'OK',
    ERROR: 'ERROR',
    WARNING: 'WARNING'
} as const;

// Color status mapping
export const COLOR_STATUS = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
} as const;

// Conversion constants to replace magic numbers
export const CONVERSION_FACTORS = {
    POUNDS_TO_TONS: 2000,
    DEGREES_TO_RADIANS: Math.PI / 180,
    TENSILE_TO_SHEAR_RATIO: 0.75,
    INCHES_PER_FOOT: 12,
    SECONDS_PER_MINUTE: 60
} as const;

// Angular measurements for feed calculations
export const ANGLES = {
    FEED_ANGLE_180: 180,
    FEED_ANGLE_240: 240
} as const;

export type RequiredCheckboxField = typeof REQUIRED_CHECKBOX_FIELDS[number];
export type StatusValue = typeof STATUS_VALUES[keyof typeof STATUS_VALUES];
export type ColorStatus = typeof COLOR_STATUS[keyof typeof COLOR_STATUS];

// Type guard function to check if a field is a required checkbox field
export const isRequiredCheckboxField = (field: string): field is RequiredCheckboxField => {
    return (REQUIRED_CHECKBOX_FIELDS as readonly string[]).includes(field);
};
