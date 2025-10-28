/**
 * Autofill Test Script
 *
 * Tests the server-side autofill functionality to ensure it produces
 * the same results as the client-side implementation
 */

import { AutofillEngine } from './autofill-engine';
import { PerformanceData } from './types/performance-data.types';

// Test data - simulating a typical performance sheet
const testData: PerformanceData = {
    common: {
        material: {
            materialType: 'Steel',
            materialThickness: '0.125',
            maxYieldStrength: '50000',
            coilWidth: '48'
        },
        coil: {
            maxCoilWeight: '20000',
            maxCoilOD: '60',
            coilID: '20',
            maxCoilWidth: '48'
        },
        feedRates: {
            average: {
                length: '12',
                spm: '30'
            },
            min: {
                length: '6',
                spm: '15'
            },
            max: {
                length: '24',
                spm: '60'
            }
        },
        equipment: {
            feed: {
                lineType: 'Conventional',
                direction: 'Left to Right'
            }
        }
    },
    feed: {
        feed: {
            application: 'Press Feed',
            pullThru: {
                isPullThru: 'No'
            }
        }
    },
    rfq: {
        press: {
            maxSPM: '60'
        },
        dies: {
            progressiveDies: true,
            transferDies: false,
            blankingDies: false
        },
        voltageRequired: '480V'
    }
};

// Test 1: Generate comprehensive autofill suggestions
console.log('=== Test 1: Generate Autofill Suggestions ===\n');
const result = AutofillEngine.generateAutofillSuggestions(testData, {
    performanceSheetId: 'test-sheet-123',
    transformData: true
});

console.log('Success:', result.success);
console.log('Visible Tabs:', result.visibleTabs.join(', '));
console.log('Has Sufficient Data:', result.metadata.hasSufficientData);
console.log('\nNumber of Suggestions:', Object.keys(result.suggestions).length);
console.log('\nSample Suggestions:');
Object.entries(result.suggestions).slice(0, 10).forEach(([key, value]) => {
    console.log(`  ${key}: ${JSON.stringify(value)}`);
});

// Test 2: Field trigger check
console.log('\n=== Test 2: Field Trigger Check ===\n');
const triggeredTabs = AutofillEngine.getFieldAutofillStrategy('common.material.materialType', testData);
console.log('Triggered Tabs for materialType:', triggeredTabs);

// Test 3: Tab-specific autofill
console.log('\n=== Test 3: Tab-Specific Autofill ===\n');
const rfqSuggestions = AutofillEngine.getTabAutofillSuggestions(testData, 'rfq');
console.log('RFQ Tab Suggestions:', Object.keys(rfqSuggestions).length, 'fields');

// Test 4: Check tab autofill capability
console.log('\n=== Test 4: Tab Autofill Capability ===\n');
const tabs = ['rfq', 'material-specs', 'str-utility', 'feed', 'tddbhd'];
tabs.forEach(tab => {
    const canAutofill = AutofillEngine.canAutofillTab(testData, tab);
    console.log(`Can autofill ${tab}:`, canAutofill);
});

// Test 5: Completion progress
console.log('\n=== Test 5: Completion Progress ===\n');
const completionCheck = AutofillEngine.checkInitialAutofillTrigger(testData, 'test-sheet-123');
console.log('RFQ Complete:', completionCheck.completionState.rfqComplete);
console.log('Material Specs Complete:', completionCheck.completionState.materialSpecsComplete);
console.log('Should Trigger Initial Autofill:', completionCheck.shouldTriggerInitialAutofill);
console.log('\nCompletion Progress:');
console.log('  RFQ:', completionCheck.completionState);
console.log('  Overall:', result.metadata.completionProgress.overallProgress);

// Test 6: High-priority fields
console.log('\n=== Test 6: High-Priority Fields ===\n');
const highPriorityFields = AutofillEngine.getHighPriorityFields();
console.log('High-Priority Fields:', highPriorityFields.slice(0, 5).join(', '), '...');
console.log('Total:', highPriorityFields.length, 'fields');

// Test 7: Meaningful value check
console.log('\n=== Test 7: Meaningful Value Check ===\n');
const testValues = [
    { value: '0.125', expected: true },
    { value: '', expected: false },
    { value: 'Select...', expected: false },
    { value: 50000, expected: true },
    { value: 0, expected: false },
    { value: true, expected: true }
];

testValues.forEach(test => {
    const result = AutofillEngine.hasMeaningfulValue(test.value);
    const status = result === test.expected ? '✓' : '✗';
    console.log(`${status} Value "${test.value}" (${typeof test.value}): ${result} (expected: ${test.expected})`);
});

console.log('\n=== All Tests Complete ===\n');
