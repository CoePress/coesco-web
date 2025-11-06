/**
 * Autofill Scripts - Main Entry Point
 *
 * Server-side autofill logic migrated from client
 * Provides the same autofill functionality as the client-side services
 */

export { debugDataTransformation, transformDataForAutofill } from "./services/autofill-data-transformer";

// Export services
export { AutofillTriggerService } from "./services/autofill-trigger.service";

// Export type interfaces
export type { AutofillStrategy, AutofillTriggerMapping } from "./services/autofill-trigger.service";
export { InitialAutofillTriggerService } from "./services/initial-autofill-trigger.service";
export type { FieldCompletionState } from "./services/initial-autofill-trigger.service";
export { ValidationAwareAutofillService } from "./services/validation-aware-autofill.service";

export type { EngineeringDefaults, ValidationRule } from "./services/validation-aware-autofill.service";
// Export types
export * from "./types/performance-data.types";
// Export utilities
export * from "./utils/tab-visibility";
