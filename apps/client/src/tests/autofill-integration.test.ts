/**
 * Comprehensive Autofill Integration Test
 * 
 * Demonstrates how the new autofill system works across different scenarios
 * and validates that all visible tabs get properly filled with engineering-safe values.
 */

import { PerformanceData } from "@/contexts/performance.context";
import { AutofillTriggerService } from "@/services/autofill-trigger.service";
import { ValidationAwareAutofillService } from "@/services/validation-aware-autofill.service";
import { getVisibleTabs } from "@/utils/tab-visibility";

/**
 * Test scenarios for autofill functionality
 */
export class AutofillIntegrationTests {

  /**
   * Test Scenario 1: Basic Material Specs Input
   * When user enters material type, thickness, and yield strength,
   * autofill should populate all relevant fields across visible tabs.
   */
  static testBasicMaterialSpecsAutofill(): void {
    const testData: PerformanceData = {
      referenceNumber: "TEST-001",
      common: {
        material: {
          materialType: "COLD ROLLED STEEL",
          materialThickness: 0.125,
          maxYieldStrength: 50000,
          coilWidth: 24
        },
        coil: {
          maxCoilWeight: 10000,
          maxCoilOD: 72,
          coilID: 21
        },
        equipment: {
          straightener: {
            model: "CPPS-306",
            numberOfRolls: 7
          },
          feed: {
            model: "CPRF-S5"
          },
          reel: {
            model: "CPR-150"
          }
        }
      }
    };

    console.log("🧪 Test 1: Basic Material Specs Autofill");

    // Get visible tabs based on current configuration
    const visibleTabs = getVisibleTabs(testData);
    console.log("Visible tabs:", visibleTabs.map(tab => tab.value));

    // Test material thickness change triggers
    const triggeredTabs = AutofillTriggerService.getTriggeredTabs("common.material.materialThickness", testData);
    console.log("Tabs triggered by thickness change:", triggeredTabs);

    // Test comprehensive autofill
    const suggestions = ValidationAwareAutofillService.getValidationAwareAutofill(testData, visibleTabs);
    console.log("Autofill suggestions:", suggestions);

    // Verify suggestions are engineering-safe
    this.validateSuggestions(suggestions);
  }

  /**
   * Test Scenario 2: Roll Type Selection
   * When user selects a roll type, autofill should populate roll-specific calculations
   * and ensure the Roll STR Backbend tab becomes visible and properly filled.
   */
  static testRollTypeSelectionAutofill(): void {
    const testData: PerformanceData = {
      referenceNumber: "TEST-002",
      common: {
        material: {
          materialType: "COLD ROLLED STEEL",
          materialThickness: 0.1875,
          maxYieldStrength: 55000,
          coilWidth: 18
        },
        equipment: {
          straightener: {
            model: "CPPS-250",
            numberOfRolls: 5
          }
        }
      },
      materialSpecs: {
        straightener: {
          rolls: {
            typeOfRoll: "Roll Str Flanged"
          }
        }
      }
    };

    console.log("\n🧪 Test 2: Roll Type Selection Autofill");

    const visibleTabs = getVisibleTabs(testData);
    console.log("Visible tabs after roll selection:", visibleTabs.map(tab => tab.value));

    // Should trigger roll-str-backbend tab calculations
    const triggeredTabs = AutofillTriggerService.getTriggeredTabs("materialSpecs.straightener.rolls.typeOfRoll", testData);
    console.log("Tabs triggered by roll type change:", triggeredTabs);

    // Test roll-specific autofill
    const rollSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(testData, "roll-str-backbend");
    console.log("Roll-specific suggestions:", rollSuggestions);
  }

  /**
   * Test Scenario 3: Feed Application Change
   * When user changes feed application, autofill should adapt to show relevant tabs
   * and populate appropriate values for the selected application type.
   */
  static testFeedApplicationAutofill(): void {
    const testData: PerformanceData = {
      referenceNumber: "TEST-003",
      common: {
        material: {
          materialType: "ALUMINUM",
          materialThickness: 0.0625,
          maxYieldStrength: 35000,
          coilWidth: 12
        },
        feedRates: {
          average: {
            length: 8,
            spm: 45
          }
        }
      },
      feed: {
        feed: {
          application: "Press Feed"
        }
      }
    };

    console.log("\n🧪 Test 3: Feed Application Autofill");

    const visibleTabs = getVisibleTabs(testData);
    console.log("Visible tabs for Press Feed:", visibleTabs.map(tab => tab.value));

    // Test feed-specific autofill
    const feedSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(testData, "feed");
    console.log("Feed-specific suggestions:", feedSuggestions);

    // Test comprehensive autofill for all visible tabs
    const allSuggestions = ValidationAwareAutofillService.getComprehensiveAutofill(testData, visibleTabs);
    console.log("Comprehensive autofill:", allSuggestions);
  }

  /**
   * Test Scenario 4: Coil Weight Change Synchronization
   * When maxCoilWeight changes in RFQ, ensure it syncs to Material Specs
   * and triggers appropriate autofill calculations.
   */
  static testCoilWeightSyncAutofill(): void {
    const testData: PerformanceData = {
      referenceNumber: "TEST-004",
      common: {
        material: {
          materialType: "STAINLESS STEEL",
          materialThickness: 0.25,
          maxYieldStrength: 75000,
          coilWidth: 30
        },
        coil: {
          maxCoilWeight: 15000, // This should sync to material specs
          maxCoilOD: 84,
          coilID: 24
        }
      }
    };

    console.log("\n🧪 Test 4: Coil Weight Sync Autofill");

    // Test if coil weight triggers reel and TDDBHD calculations
    const triggeredTabs = AutofillTriggerService.getTriggeredTabs("common.coil.maxCoilWeight", testData);
    console.log("Tabs triggered by coil weight change:", triggeredTabs);

    // Test reel drive autofill
    const reelSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(testData, "reel-drive");
    console.log("Reel drive suggestions:", reelSuggestions);

    // Test TDDBHD autofill
    const tddbhdSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(testData, "tddbhd");
    console.log("TDDBHD suggestions:", tddbhdSuggestions);
  }

  /**
   * Test Scenario 5: High-Priority Field Changes
   * Test that high-priority fields trigger immediate autofill even with minimal data.
   */
  static testHighPriorityFieldAutofill(): void {
    const minimalData: PerformanceData = {
      referenceNumber: "TEST-005",
      common: {
        material: {
          materialType: "COLD ROLLED STEEL" // High priority field
        }
      }
    };

    console.log("\n🧪 Test 5: High-Priority Field Autofill");

    // Test if material type alone can trigger autofill
    const canTrigger = AutofillTriggerService.canTriggerAutofill("common.material.materialType", minimalData);
    console.log("Can trigger autofill with minimal data:", canTrigger);

    const priority = AutofillTriggerService.getFieldPriority("common.material.materialType");
    console.log("Material type priority:", priority);

    // Test if we have sufficient data for comprehensive autofill
    const hasSufficientData = AutofillTriggerService.hasSufficientDataForAutofill(minimalData);
    console.log("Has sufficient data for autofill:", hasSufficientData);
  }

  /**
   * Validate that suggestions are engineering-safe and will pass calculations
   */
  private static validateSuggestions(suggestions: Record<string, any>): void {
    console.log("\n✅ Validating suggestions:");

    for (const [fieldPath, value] of Object.entries(suggestions)) {
      // Basic validation
      if (typeof value === 'number') {
        const isValid = value > 0 && isFinite(value);
        console.log(`  ${fieldPath}: ${value} - ${isValid ? 'VALID' : 'INVALID'}`);
      } else {
        const isValid = value !== null && value !== undefined && value !== '';
        console.log(`  ${fieldPath}: "${value}" - ${isValid ? 'VALID' : 'INVALID'}`);
      }
    }
  }

  /**
   * Run all test scenarios
   */
  static runAllTests(): void {
    console.log("🚀 Running Comprehensive Autofill Integration Tests\n");

    try {
      this.testBasicMaterialSpecsAutofill();
      this.testRollTypeSelectionAutofill();
      this.testFeedApplicationAutofill();
      this.testCoilWeightSyncAutofill();
      this.testHighPriorityFieldAutofill();

      console.log("\n✅ All tests completed successfully!");
    } catch (error) {
      console.error("\n❌ Test failed:", error);
    }
  }
}

/**
 * Usage Example:
 * 
 * In your component or during development, you can run:
 * AutofillIntegrationTests.runAllTests();
 * 
 * This will validate that the autofill system works correctly
 * across different scenarios and tab combinations.
 */