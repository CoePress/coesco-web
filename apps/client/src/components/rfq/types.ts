/**
 * Shared types for RFQ components
 */

import { PerformanceData } from "@/contexts/performance.context";

// Base props that all RFQ section components will receive
export interface RFQSectionProps {
    localData: PerformanceData;
    fieldErrors: Record<string, string>;
    handleFieldChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    getFieldBackgroundColor: (fieldName: string) => "error" | "success" | "warning" | "info" | undefined;
    getFieldError: (fieldName: string) => string | undefined;
    isEditing: boolean;
}

// Specific props for components that need additional functionality
export interface RFQSectionWithValidationProps extends RFQSectionProps {
    requiredFields: string[];
}
