# Initial Autofill Trigger System

This document explains the implementation of the one-time initial autofill trigger system that fires when RFQ and Material Specs required fields are completed.

## Overview

The system implements intelligent autofill behavior:
- **Initial Mode**: Waits for RFQ and Material Specs completion before triggering autofill once
- **Normal Mode**: After initial trigger, behaves with standard autofill logic based on field changes

## Architecture

### Core Components

#### 1. InitialAutofillTriggerService (`/services/initial-autofill-trigger.service.ts`)
- **Purpose**: Manages completion state tracking and trigger logic
- **Key Features**:
  - Tracks 51 required RFQ fields and 4 required Material Specs fields
  - Persists state in localStorage per performance sheet
  - Provides completion progress calculation
  - Prevents duplicate triggers

**Key Methods**:
```typescript
// Check if all RFQ required fields are complete
areRfqFieldsComplete(data: PerformanceData): boolean

// Check if all Material Specs required fields are complete
areMaterialSpecsFieldsComplete(data: PerformanceData): boolean

// Check completion state and determine if initial trigger should fire
checkAndUpdateCompletionState(data: PerformanceData, sheetId: string): {
  shouldTriggerInitialAutofill: boolean;
  completionState: FieldCompletionState;
  isFirstTimeComplete: boolean;
}

// Mark that initial autofill has been triggered (prevents re-triggering)
markInitialAutofillTriggered(sheetId: string): void

// Get completion progress for UI display
getCompletionProgress(data: PerformanceData): ProgressInfo
```

#### 2. Enhanced AutoFill Context (`/contexts/performance/autofill.context.tsx`)
- **Purpose**: Integrates initial trigger logic with existing autofill system
- **New State**:
  ```typescript
  interface AutoFillState {
    // ... existing fields
    initialTriggerState: FieldCompletionState | null;
    isInitialTriggerMode: boolean;
  }
  ```

- **Enhanced triggerAutoFill Method**:
  ```typescript
  // Now checks initial trigger conditions when in initial mode
  if (state.isInitialTriggerMode) {
    const { shouldTriggerInitialAutofill } = InitialAutofillTriggerService
      .checkAndUpdateCompletionState(performanceData, sheetId);
    
    if (!shouldTriggerInitialAutofill) return;
    
    // Mark as triggered and switch to normal mode
    InitialAutofillTriggerService.markInitialAutofillTriggered(sheetId);
    dispatch({ type: 'SET_INITIAL_TRIGGER_MODE', payload: false });
  }
  ```

#### 3. Enhanced AutoFill Watcher Hook (`/contexts/performance/use-autofill-watcher.hook.ts`)
- **Purpose**: Monitors field changes and handles both initial and normal autofill triggers
- **New Logic**:
  - Separate effect for initial trigger monitoring
  - Normal autofill logic disabled during initial mode
  - Debounced initial trigger checks (1 second)

#### 4. UI Components

**InitialAutofillProgress** (`/components/performance/InitialAutofillProgress.tsx`):
- Shows completion progress for RFQ and Material Specs
- Visual progress bars and status indicators
- Only visible during initial trigger mode

**InitialAutofillDevTools** (`/components/performance/InitialAutofillDevTools.tsx`):
- Development-only component for testing and debugging
- Provides manual trigger testing, state reset, and progress checking
- Console output capture for test results

## Required Fields

### RFQ Calculation Fields (26 total)
**Focus: Only technical fields necessary for performance calculations**
- Feed Configuration: application, lineType, direction, pullThru
- Coil Specifications: maxCoilWidth, coilID, maxCoilOD, maxCoilWeight  
- Feed Rates: average/max length, spm, fpm
- Press Settings: maxSPM
- Die Configuration: transferDies, progressiveDies, blankingDies
- Physical Constraints: voltageRequired, equipmentSpaceLength, equipmentSpaceWidth
- **NEW**: Reel/Passline: passline, reelBackplateType, reelStyle (needed for other tab calculations)

### RFQ Minimal Fields (4 total) - NEW FEATURE
**For partial calculations (FPM from SPM and length)**
- `common.feedRates.average.length`
- `common.feedRates.average.spm`
- `common.feedRates.max.length`
- `common.feedRates.max.spm`

### Material Specs Calculation Fields (4 total)
- `common.material.materialThickness`
- `common.material.coilWidth` 
- `common.material.materialType`
- `common.material.maxYieldStrength`

**Total: 30 calculation-essential fields** (with partial RFQ calculations available at 4 fields)

## State Management

### FieldCompletionState Interface
```typescript
interface FieldCompletionState {
  rfqComplete: boolean;
  materialSpecsComplete: boolean;
  hasTriggeredInitialAutofill: boolean;
  completedAt?: Date;
  triggeredAt?: Date;
}
```

### localStorage Persistence
- Key format: `initial-autofill-state-${performanceSheetId}`
- Persists completion state across browser sessions
- Automatic cleanup when state is reset

## Workflow

### Partial RFQ Calculations (NEW)
1. **Minimal Data Entry**: User enters SPM and length values
2. **Automatic FPM Calculation**: System calculates FPM = (SPM × length) ÷ 12
3. **Real-time Updates**: FPM fields update automatically as user types
4. **Visual Feedback**: Calculator icon shows active calculations

### Initial Mode (Default)
1. System starts in initial trigger mode (`isInitialTriggerMode: true`)
2. Monitors RFQ and Material Specs field completion
3. When both sections complete:
   - Triggers autofill automatically
   - Marks as triggered in localStorage
   - Switches to normal mode (`isInitialTriggerMode: false`)

### Normal Mode (After Initial Trigger)
1. Uses existing autofill logic based on field changes
2. Responds to high-priority field updates
3. Maintains standard debouncing and sufficient data checks

## Testing

### Automated Tests (`/tests/initial-autofill-trigger.test.ts`)
- Validates RFQ and Material Specs completion detection
- Tests trigger logic with complete/incomplete data
- Verifies prevention of duplicate triggers
- Checks completion progress calculations

### Development Tools
- Real-time state inspection
- Manual trigger testing
- Progress monitoring
- State reset functionality

## Integration Points

### Performance Sheet Context
The system integrates seamlessly with existing performance sheet functionality:
- Uses existing `PerformanceData` structure
- Leverages current field validation logic
- Maintains compatibility with all existing features

### Autofill Pipeline
- Hooks into existing autofill API (`/performance/sheets/${sheetId}/autofill`)
- Uses current data transformation utilities
- Preserves user input protection settings
- Maintains field tracking for auto-filled vs manual values

## Benefits

1. **User Experience**: Clear progression toward autofill activation
2. **Performance**: Prevents premature autofill triggers with incomplete data
3. **Reliability**: One-time trigger prevents confusion from multiple autofills
4. **Flexibility**: Normal autofill behavior after initial trigger
5. **Transparency**: Progress indicators and development tools for debugging

## Configuration

### Customizable Aspects
- Required fields lists (easily modifiable in service)
- Debounce timings (1s for initial, 2s for normal)
- Progress calculation logic
- localStorage key prefixes

### Environment-Specific Features
- Development tools only in development mode
- Console logging for debugging
- Test data and mock functions

## Future Enhancements

1. **Admin Configuration**: Allow customization of required fields
2. **Multiple Trigger Points**: Support different trigger criteria per customer
3. **Analytics**: Track completion patterns and autofill effectiveness
4. **Validation Feedback**: Real-time field validation hints
5. **Recovery Mode**: Handle edge cases and error scenarios

## Best Practices

1. **Error Handling**: Graceful degradation if localStorage unavailable
2. **Performance**: Efficient field value checking with early exits
3. **Maintainability**: Clear separation of concerns between services
4. **Testing**: Comprehensive test coverage for all trigger scenarios
5. **Documentation**: Inline comments and comprehensive API documentation