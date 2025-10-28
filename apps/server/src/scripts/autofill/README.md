# Autofill Scripts

Server-side autofill logic migrated from client. These scripts provide the same autofill functionality as the client-side services, allowing autofill operations to be performed entirely on the server.

## Structure

```
autofill/
├── types/
│   └── performance-data.types.ts    # Performance data type definitions
├── utils/
│   └── tab-visibility.ts            # Tab visibility logic
├── services/
│   ├── autofill-trigger.service.ts              # Field trigger mappings
│   ├── validation-aware-autofill.service.ts     # Engineering-safe defaults
│   ├── autofill-data-transformer.ts             # Data transformation utilities
│   └── initial-autofill-trigger.service.ts      # Initial autofill trigger logic
├── autofill-engine.ts               # Main orchestrator
├── index.ts                         # Public API exports
└── README.md                        # This file
```

## Services

### AutofillTriggerService
Determines which fields trigger autofill calculations for which tabs.

```typescript
import { AutofillTriggerService } from './services/autofill-trigger.service';

// Check if field can trigger autofill
const canTrigger = AutofillTriggerService.canTriggerAutofill('common.material.materialType', data);

// Get tabs that should be triggered
const triggeredTabs = AutofillTriggerService.getTriggeredTabs('common.material.materialType', data);

// Get autofill strategy
const strategy = AutofillTriggerService.getAutofillStrategy('common.material.materialType', data);
```

### ValidationAwareAutofillService
Provides engineering-safe default values that will pass validation checks.

```typescript
import { ValidationAwareAutofillService } from './services/validation-aware-autofill.service';
import { getVisibleTabs } from './utils/tab-visibility';

// Get comprehensive autofill suggestions
const visibleTabs = getVisibleTabs(data);
const suggestions = ValidationAwareAutofillService.getValidationAwareAutofill(data, visibleTabs);

// Get suggestions for specific tab
const tabSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(data, 'rfq');

// Check if tab has minimum required data
const hasMinData = ValidationAwareAutofillService.hasMinimumRequiredData(data, 'str-utility');
```

### AutofillDataTransformer
Transforms form data from strings to numbers for calculations.

```typescript
import { transformDataForAutofill } from './services/autofill-data-transformer';

// Transform data (strings to numbers)
const transformedData = transformDataForAutofill(data);
```

### InitialAutofillTriggerService
Manages one-time autofill trigger when required fields are completed.

```typescript
import { InitialAutofillTriggerService } from './services/initial-autofill-trigger.service';

// Check and update completion state
const result = InitialAutofillTriggerService.checkAndUpdateCompletionState(data, 'sheet-id');

// Get completion progress
const progress = InitialAutofillTriggerService.getCompletionProgress(data);

// Mark as triggered
InitialAutofillTriggerService.markInitialAutofillTriggered('sheet-id');
```

## AutofillEngine

Main orchestrator that combines all services:

```typescript
import { AutofillEngine } from './autofill-engine';

// Generate comprehensive autofill suggestions
const result = AutofillEngine.generateAutofillSuggestions(data, {
    performanceSheetId: 'sheet-123',
    fieldChanged: 'common.material.materialType',
    transformData: true
});

// Result includes:
// - suggestions: Record<string, any>
// - triggeredTabs: string[]
// - visibleTabs: string[]
// - metadata: { hasSufficientData, shouldTriggerInitialAutofill, completionProgress }

// Get suggestions for specific tab
const tabSuggestions = AutofillEngine.getTabAutofillSuggestions(data, 'rfq');

// Check if tab can be autofilled
const canAutofill = AutofillEngine.canAutofillTab(data, 'str-utility');

// Get field autofill strategy
const strategy = AutofillEngine.getFieldAutofillStrategy('common.material.materialType', data);
```

## Usage Example

```typescript
import { AutofillEngine } from '@/scripts/autofill';
import { PerformanceData } from '@/scripts/autofill/types/performance-data.types';

// Sample performance data
const performanceData: PerformanceData = {
    common: {
        material: {
            materialType: 'Steel',
            materialThickness: '0.125',
            maxYieldStrength: '50000',
            coilWidth: '48'
        },
        equipment: {
            feed: {
                lineType: 'Conventional'
            }
        }
    },
    feed: {
        feed: {
            application: 'Press Feed'
        }
    }
};

// Generate autofill suggestions
const result = AutofillEngine.generateAutofillSuggestions(performanceData, {
    performanceSheetId: 'sheet-123',
    transformData: true
});

console.log('Autofill Suggestions:', result.suggestions);
console.log('Triggered Tabs:', result.triggeredTabs);
console.log('Has Sufficient Data:', result.metadata.hasSufficientData);
console.log('Completion Progress:', result.metadata.completionProgress);
```

## Migration Notes

These scripts were migrated from the client-side implementation with the following changes:

1. **Removed Client Dependencies**: Removed React context imports and replaced with direct type definitions
2. **Storage Mechanism**: InitialAutofillTriggerService uses in-memory Map instead of localStorage (can be adapted to use database/cache)
3. **No Frontend Changes**: The logic remains identical to maintain consistency with client behavior
4. **Same Results**: All services produce the same results as their client-side counterparts

## Integration

To use these scripts in your server-side code:

```typescript
// In your server controller/service
import { AutofillEngine } from '@/scripts/autofill';

export class PerformanceController {
    async getAutofillSuggestions(req, res) {
        const { data, performanceSheetId } = req.body;

        const result = AutofillEngine.generateAutofillSuggestions(data, {
            performanceSheetId,
            transformData: true
        });

        return res.json(result);
    }
}
```

## Testing

To test the autofill logic:

```typescript
import { AutofillEngine } from './autofill-engine';
import { PerformanceData } from './types/performance-data.types';

// Test data
const testData: PerformanceData = {
    // ... your test data
};

// Run autofill
const result = AutofillEngine.generateAutofillSuggestions(testData);

console.log('Test Results:', JSON.stringify(result, null, 2));
```
