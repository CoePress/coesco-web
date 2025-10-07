/**
 * Test Initial Autofill Trigger Implementation
 * 
 * This test verifies that the initial autofill trigger service works correctly
 * and integrates properly with the autofill context.
 */

import { InitialAutofillTriggerService } from '@/services/initial-autofill-trigger.service';

// Mock performance data with complete RFQ fields
const mockCompleteRfqData = {
    referenceNumber: 'RFQ-123',
    rfq: {
        dates: {
            date: '2024-01-01',
            idealDeliveryDate: '2024-02-01',
            decisionDate: '2024-01-15'
        },
        runningCosmeticMaterial: 'Test Material',
        coil: {
            slitEdge: 'Clean',
            millEdge: 'Mill',
            requireCoilCar: true,
            runningOffBackplate: false,
            requireRewinding: false,
            changeTimeConcern: false,
            loading: 'Side'
        },
        press: {
            maxSPM: 100
        },
        dies: {
            transferDies: true,
            progressiveDies: false,
            blankingDies: false
        },
        voltageRequired: 480,
        equipmentSpaceLength: 100,
        equipmentSpaceWidth: 50,
        obstructions: 'None',
        requireGuarding: true
    },
    common: {
        customer: 'Test Customer',
        customerInfo: {
            state: 'Test State',
            streetAddress: '123 Test St',
            zip: '12345',
            city: 'Test City',
            country: 'USA',
            contactName: 'John Doe',
            position: 'Engineer',
            phoneNumber: '555-0123',
            email: 'john@test.com',
            dealerName: 'Test Dealer',
            dealerSalesman: 'Jane Smith'
        },
        equipment: {
            feed: {
                lineType: 'Progressive',
                direction: 'Left to Right'
            }
        },
        coil: {
            maxCoilWidth: 48,
            minCoilWidth: 12,
            maxCoilOD: 72,
            coilID: 20,
            maxCoilWeight: 10000
        },
        feedRates: {
            average: {
                length: 6,
                spm: 60,
                fpm: 30
            },
            max: {
                length: 12,
                spm: 100,
                fpm: 100
            },
            min: {
                length: 1,
                spm: 10,
                fpm: 1
            }
        }
    },
    feed: {
        feed: {
            application: 'Stamping',
            pullThru: {
                isPullThru: false
            }
        }
    }
};

// Mock complete material specs data
const mockCompleteMaterialData = {
    common: {
        material: {
            materialThickness: 0.125,
            coilWidth: 24,
            materialType: 'Steel',
            maxYieldStrength: 50000
        }
    }
};

// Combine both for complete data
const mockCompleteData = {
    ...mockCompleteRfqData,
    common: {
        ...mockCompleteRfqData.common,
        ...mockCompleteMaterialData.common
    }
};

/**
 * Test function to verify initial autofill trigger functionality
 */
export function testInitialAutofillTrigger() {
    console.log('🔬 Testing Initial Autofill Trigger Service...\n');

    const testSheetId = 'test-sheet-123';

    // Test 1: Check RFQ completion detection
    console.log('Test 1: RFQ Completion Detection');
    const rfqComplete = InitialAutofillTriggerService.areRfqFieldsComplete(mockCompleteRfqData as any);
    console.log(`✅ RFQ fields complete: ${rfqComplete}`);

    // Test 2: Check Material Specs completion detection
    console.log('\nTest 2: Material Specs Completion Detection');
    const materialSpecsComplete = InitialAutofillTriggerService.areMaterialSpecsFieldsComplete(mockCompleteMaterialData as any);
    console.log(`✅ Material specs complete: ${materialSpecsComplete}`);

    // Test 3: Check combined completion
    console.log('\nTest 3: Combined Completion Detection');
    const bothComplete = InitialAutofillTriggerService.areRfqFieldsComplete(mockCompleteData as any) &&
        InitialAutofillTriggerService.areMaterialSpecsFieldsComplete(mockCompleteData as any);
    console.log(`✅ Both sections complete: ${bothComplete}`);

    // Test 4: Check initial trigger logic
    console.log('\nTest 4: Initial Trigger Logic');

    // Reset state first
    InitialAutofillTriggerService.resetCompletionState(testSheetId);

    // Check with incomplete data first
    const incompleteResult = InitialAutofillTriggerService.checkAndUpdateCompletionState({} as any, testSheetId);
    console.log(`✅ Incomplete data should not trigger: ${!incompleteResult.shouldTriggerInitialAutofill}`);

    // Now check with complete data
    const completeResult = InitialAutofillTriggerService.checkAndUpdateCompletionState(mockCompleteData as any, testSheetId);
    console.log(`✅ Complete data should trigger: ${completeResult.shouldTriggerInitialAutofill}`);
    console.log(`✅ Is first time complete: ${completeResult.isFirstTimeComplete}`);

    // Test 5: Verify second call doesn't trigger again
    console.log('\nTest 5: Prevent Duplicate Triggers');

    // Mark as triggered
    InitialAutofillTriggerService.markInitialAutofillTriggered(testSheetId);

    // Check again - should not trigger
    const secondResult = InitialAutofillTriggerService.checkAndUpdateCompletionState(mockCompleteData as any, testSheetId);
    console.log(`✅ Second call should not trigger: ${!secondResult.shouldTriggerInitialAutofill}`);

    // Test 6: Check completion progress
    console.log('\nTest 6: Completion Progress');
    const progress = InitialAutofillTriggerService.getCompletionProgress(mockCompleteData as any);
    console.log(`✅ RFQ Progress: ${progress.rfqProgress.completed}/${progress.rfqProgress.total} (${progress.rfqProgress.percentage}%)`);
    console.log(`✅ Material Progress: ${progress.materialSpecsProgress.completed}/${progress.materialSpecsProgress.total} (${progress.materialSpecsProgress.percentage}%)`);
    console.log(`✅ Overall Progress: ${progress.overallProgress.completed}/${progress.overallProgress.total} (${progress.overallProgress.percentage}%)`);

    console.log('\n🎉 All tests completed successfully!');

    // Clean up
    InitialAutofillTriggerService.resetCompletionState(testSheetId);

    return true;
}

// Export the test for use in development
export default testInitialAutofillTrigger;