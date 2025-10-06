/**
 * Debug Autofill Issues
 * 
 * Test the specific case from the user's data to understand why autofill isn't triggering
 */

import { AutofillTriggerService } from "@/services/autofill-trigger.service";
import { ValidationAwareAutofillService } from "@/services/validation-aware-autofill.service";
import { getVisibleTabs } from "@/utils/tab-visibility";

export const debugAutofillIssue = () => {
  console.log("Autofill Issue Analysis");

  // User's actual data from the issue
  const userData = {
    "rfq": {
      "coil": {
        "loading": "operatorSide",
        "millEdge": false,
        "slitEdge": true,
        "requireCoilCar": "No",
        "timeChangeGoal": "",
        "requireRewinding": "No",
        "changeTimeConcern": "No",
        "runningOffBackplate": "No"
      },
      "dies": {
        "blankingDies": false,
        "transferDies": false,
        "progressiveDies": true
      }
    },
    "feed": {
      "feed": {
        "application": "Press Feed",
        "pullThru": {
          "isPullThru": "No"
        }
      }
    },
    "common": {
      "coil": {
        "coilID": 16,
        "maxCoilOD": 60,
        "maxCoilWidth": 6,
        "minCoilWidth": 1,
        "maxCoilWeight": 4000
      },
      "customer": "Saint-Gobain",
      "material": {
        "coilWidth": 3,
        "reqMaxFPM": 50,
        "coilWeight": 4000,
        "materialType": "Cold Rolled Steel",
        "materialDensity": 0.283,
        "maxYieldStrength": 45000,
        "materialThickness": 0.07,
        "maxTensileStrength": 0
      },
      "equipment": {
        "feed": {
          "model": "CPRF-S1",
          "lineType": "Conventional",
          "passline": "55",
          "direction": "Left to Right",
          "nonMarking": "true",
          "typeOfLine": "Conventional",
          "controlsLevel": "Relay Machine"
        },
        "reel": {
          "model": "CPR-040"
        },
        "straightener": {
          "model": "CPPS-250",
          "numberOfRolls": 7
        }
      },
      "feedRates": {
        "max": {
          "fpm": 50,
          "spm": 200,
          "length": 3
        },
        "min": {
          "fpm": 100,
          "spm": 6,
          "length": 200
        },
        "average": {
          "fpm": 25,
          "spm": 200,
          "length": 1.5
        }
      }
    },
    "materialSpecs": {
      "straightener": {
        "rolls": {
          "typeOfRoll": "7 Roll Str. Backbend"
        }
      }
    },
    "referenceNumber": "25-00253"
  };

  console.log("📊 Step 1: Check visible tabs");
  const visibleTabs = getVisibleTabs(userData);
  console.log("Visible tabs:", visibleTabs.map(tab => tab.value));

  console.log("\nStep 2: Test changed fields from watcher");
  const changedFields = [
    "common.equipment.straightener.model",
    "common.equipment.feed.model",
    "common.material.materialType",
    "common.material.materialThickness",
    "common.material.maxYieldStrength",
    "common.material.coilWidth",
    "common.feedRates.average.length",
    "common.feedRates.average.spm"
  ];

  changedFields.forEach(fieldName => {
    console.log(`\n--- Field: ${fieldName} ---`);

    const canTrigger = AutofillTriggerService.canTriggerAutofill(fieldName, userData);
    const priority = AutofillTriggerService.getFieldPriority(fieldName);
    const isHighPriority = priority >= 70;
    const hasSufficientData = AutofillTriggerService.hasSufficientDataForAutofill(userData);
    const triggeredTabs = AutofillTriggerService.getTriggeredTabs(fieldName, userData);

    console.log(`  Can trigger: ${canTrigger ? 'YES' : 'NO'}`);
    console.log(`  Priority: ${priority} (${isHighPriority ? 'HIGH' : 'low'})`);
    console.log(`  Sufficient data: ${hasSufficientData ? 'YES' : 'NO'}`);
    console.log(`  Triggered tabs: ${triggeredTabs.join(', ') || 'none'}`);

    const shouldTriggerAutofill = canTrigger && (isHighPriority || hasSufficientData);
    console.log(`  Should trigger autofill: ${shouldTriggerAutofill ? 'YES' : 'NO'}`);

    if (shouldTriggerAutofill) {
      const strategy = AutofillTriggerService.getAutofillStrategy(fieldName, userData);
      console.log(`  Strategy:`, strategy);

      const suggestions = AutofillTriggerService.getSuggestedAutofillFields(userData, visibleTabs);
      console.log(`  Suggestions count: ${Object.keys(suggestions).length}`);
      if (Object.keys(suggestions).length > 0) {
        console.log(`  Suggestions:`, suggestions);
      }
    }
  });

  console.log("\nStep 3: Test comprehensive autofill");
  const comprehensiveSuggestions = ValidationAwareAutofillService.getComprehensiveAutofill(userData, visibleTabs);
  console.log(`Comprehensive suggestions count: ${Object.keys(comprehensiveSuggestions).length}`);
  console.log("Comprehensive suggestions:", comprehensiveSuggestions);

  console.log("\nStep 4: Test tab-specific autofill");
  visibleTabs.forEach(tab => {
    const tabSuggestions = ValidationAwareAutofillService.getPassingCalculationValues(userData, tab.value);
    const hasMinData = ValidationAwareAutofillService.hasMinimumRequiredData(userData, tab.value);
    console.log(`${tab.value}: ${Object.keys(tabSuggestions).length} suggestions, hasMinData: ${hasMinData}`);
  });

  console.log("\nStep 5: Check for empty fields that should be filled");
  const allFieldPaths = [
    'rfq.dates.date',
    'rfq.coil.slitEdge',
    'rfq.coil.millEdge',
    'common.equipment.feed.typeOfLine',
    'feed.feed.pullThru.isPullThru',
    'common.equipment.feed.controlsLevel',
    'materialSpecs.feed.controls'
  ];

  allFieldPaths.forEach(fieldPath => {
    const currentValue = AutofillTriggerService.getNestedValue(userData, fieldPath);
    const hasMeaningfulValue = AutofillTriggerService.hasMeaningfulValue(currentValue);
    console.log(`${fieldPath}: "${currentValue}" (meaningful: ${hasMeaningfulValue})`);
  });

  console.log("\nDebug analysis complete!");
};

// Usage: Call this function in your component or console to debug autofill issues
// debugAutofillIssue();