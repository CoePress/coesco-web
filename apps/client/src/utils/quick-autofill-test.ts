/**
 * Quick Autofill Test for User's Issue
 * 
 * Test the exact scenario from the user to verify autofill is working
 */

import { AutofillTriggerService } from "@/services/autofill-trigger.service";
import { ValidationAwareAutofillService } from "@/services/validation-aware-autofill.service";

// Test the user's exact data scenario
export const quickAutofillTest = () => {
  console.log("Quick Autofill Test");

  // Simulate the user's data with correct types
  const testData = {
    referenceNumber: "25-00253",
    feed: {
      feed: {
        application: "Press Feed",
        pullThru: {
          isPullThru: "No"
        }
      }
    },
    common: {
      material: {
        materialType: "Cold Rolled Steel",
        materialThickness: 0.07, // number
        maxYieldStrength: 45000, // number
        coilWidth: 3 // number
      },
      equipment: {
        feed: {
          model: "CPRF-S1",
          lineType: "Conventional",
          controlsLevel: "Relay Machine"
        },
        straightener: {
          model: "CPPS-250",
          numberOfRolls: 7
        }
      },
      feedRates: {
        average: {
          spm: 200,
          length: 1.5
        }
      }
    },
    materialSpecs: {
      straightener: {
        rolls: {
          typeOfRoll: "7 Roll Str. Backbend"
        }
      }
    }
  };

  console.log("📊 Testing changed fields that should trigger autofill:");

  const testFields = [
    "common.equipment.straightener.model",
    "common.equipment.feed.model",
    "common.material.materialType"
  ];

  testFields.forEach(fieldName => {
    console.log(`\n--- ${fieldName} ---`);

    const canTrigger = AutofillTriggerService.canTriggerAutofill(fieldName, testData);
    const priority = AutofillTriggerService.getFieldPriority(fieldName);
    const hasSufficientData = AutofillTriggerService.hasSufficientDataForAutofill(testData);

    console.log(`✓ Can trigger: ${canTrigger}`);
    console.log(`✓ Priority: ${priority}`);
    console.log(`✓ Sufficient data: ${hasSufficientData}`);

    const shouldTrigger = canTrigger && (priority >= 70 || hasSufficientData);
    console.log(`✓ Should trigger autofill: ${shouldTrigger}`);

    if (shouldTrigger) {
      console.log("🎯 AUTOFILL SHOULD ACTIVATE!");
    }
  });

  console.log("\n🔍 Testing value detection:");

  const testValues = [
    { path: "common.material.materialType", value: "Cold Rolled Steel" },
    { path: "common.material.materialThickness", value: "0.07" }, // string version
    { path: "common.material.materialThickness", value: 0.07 },   // number version
    { path: "rfq.dates.date", value: "" },
    { path: "rfq.coil.slitEdge", value: "true" }
  ];

  testValues.forEach(({ path, value }) => {
    const isMeaningful = AutofillTriggerService.hasMeaningfulValue(value);
    console.log(`${path}: "${value}" (${typeof value}) → meaningful: ${isMeaningful}`);
  });

  return testData;
};

// Export for use in console or components
export default quickAutofillTest;