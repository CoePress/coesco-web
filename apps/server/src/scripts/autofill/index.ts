/**
 * Autofill Scripts - Main Entry Point
 *
 * Server-side autofill logic migrated from client
 * Provides the same autofill functionality as the client-side services
 */

// Export types
export * from './types/performance-data.types';

// Export utilities
export * from './utils/tab-visibility';

// Export services
export { AutofillTriggerService } from './services/autofill-trigger.service';
export { ValidationAwareAutofillService } from './services/validation-aware-autofill.service';
export { transformDataForAutofill, debugDataTransformation } from './services/autofill-data-transformer';
export { InitialAutofillTriggerService } from './services/initial-autofill-trigger.service';

// Export type interfaces
export type { AutofillTriggerMapping, AutofillStrategy } from './services/autofill-trigger.service';
export type { ValidationRule, EngineeringDefaults } from './services/validation-aware-autofill.service';
export type { FieldCompletionState } from './services/initial-autofill-trigger.service';
