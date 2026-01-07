/**
 * Validation-Aware Autofill Service
 *
 * Ensures autofilled values pass all validation checks and engineering requirements.
 * Provides default values that will result in successful calculations across all visible tabs.
 * (Migrated from client to server)
 */

import type { PerformanceData } from "../types/performance-data.types";
import type { VisibleTab } from "../utils/tab-visibility";

export interface ValidationRule {
  fieldPath: string;
  validate: (value: any, data: PerformanceData) => boolean;
  suggest: (data: PerformanceData) => any;
  description: string;
}

export interface EngineeringDefaults {
  [tabName: string]: {
    [fieldPath: string]: {
      value: any;
      condition?: (data: PerformanceData) => boolean;
      priority: number;
    };
  };
}

export class ValidationAwareAutofillService {
  /**
   * Engineering-safe default values organized by tab
   */
  private static readonly ENGINEERING_DEFAULTS: EngineeringDefaults = {
    "rfq": {
      "feed.feed.application": {
        value: (data: PerformanceData) => {
          // Default to Press Feed for most common configuration
          return data?.feed?.feed?.application || "Press Feed";
        },
        condition: () => true,
        priority: 95,
      },
      "common.equipment.feed.lineType": {
        value: (data: PerformanceData) => {
          const application = data?.feed?.feed?.application;
          if (application === "Press Feed" || application === "Cut To Length") {
            return "Conventional"; // Most common for press/CTL
          }
          else if (application === "Standalone") {
            return "Feed"; // Most common standalone type
          }
          return "Conventional";
        },
        condition: data => !!data?.feed?.feed?.application,
        priority: 90,
      },
      "common.equipment.feed.typeOfLine": {
        value: (data: PerformanceData) => {
          const application = data?.feed?.feed?.application;
          const lineType = data?.common?.equipment?.feed?.lineType;

          if (application === "Press Feed") {
            return lineType === "Conventional" ? "Conventional" : "Compact";
          }
          else if (application === "Cut To Length") {
            return lineType === "Conventional" ? "Conventional CTL" : "Compact CTL";
          }
          else if (application === "Standalone") {
            return lineType || "Feed"; // Use the selected standalone type
          }
          return "Conventional";
        },
        condition: data => !!data?.feed?.feed?.application,
        priority: 88,
      },
      "feed.feed.pullThru.isPullThru": {
        value: (data: PerformanceData) => {
          const lineType = data?.common?.equipment?.feed?.lineType;
          const typeOfLine = data?.common?.equipment?.feed?.typeOfLine;

          // Default to Yes for Compact configurations or if typeOfLine mentions pull through
          return (lineType === "Compact"
            || (typeOfLine && typeOfLine.toLowerCase().includes("pull through")))
            ? "Yes"
            : "No";
        },
        condition: () => true,
        priority: 85,
      },
      "common.equipment.feed.controlsLevel": {
        value: (data: PerformanceData) => {
          const application = data?.feed?.feed?.application;
          if (application === "Press Feed") {
            return "SyncMaster"; // Common for press feed
          }
          else if (application === "Cut To Length") {
            return "SyncMaster Plus"; // Common for CTL
          }
          return "Basic"; // Default for standalone
        },
        condition: data => !!data?.feed?.feed?.application,
        priority: 80,
      },
      "materialSpecs.feed.controls": {
        value: (data: PerformanceData) => {
          const controlsLevel = data?.common?.equipment?.feed?.controlsLevel;
          const application = data?.feed?.feed?.application;

          if (controlsLevel?.includes("Sigma")) {
            return "Sigma 5 Feed";
          }
          else if (controlsLevel?.includes("Allen Bradley")) {
            return "Allen Bradley";
          }
          else if (application === "Standalone") {
            return "Basic Feed Controls";
          }
          return "Standard Feed Controls";
        },
        condition: () => true,
        priority: 75,
      },
      "materialSpecs.straightener.rolls.typeOfRoll": {
        value: (data: PerformanceData) => {
          const application = data?.feed?.feed?.application;
          const lineType = data?.common?.equipment?.feed?.lineType;

          // Default roll selection based on configuration
          if ((application === "Press Feed" || application === "Cut To Length")
            && (lineType === "Conventional" || !lineType)) {
            return "7 Roll Str. Backbend"; // Most common for conventional
          }
          return ""; // No default for other configurations
        },
        condition: (data) => {
          const app = data?.feed?.feed?.application;
          return app === "Press Feed" || app === "Cut To Length" || app === "Standalone";
        },
        priority: 85,
      },
      "rfq.dates.date": {
        value: () => {
          const today = new Date();
          return today.toISOString().split("T")[0]; // YYYY-MM-DD format
        },
        condition: () => true,
        priority: 70,
      },
      "rfq.coil.slitEdge": {
        value: () => true, // Boolean value for required checkbox
        condition: () => true,
        priority: 75,
      },
      "rfq.coil.millEdge": {
        value: () => true, // Boolean value for required checkbox
        condition: () => true,
        priority: 75,
      },
      "rfq.dies.progressiveDies": {
        value: () => true, // Boolean value for dies
        condition: () => true,
        priority: 75,
      },
      "rfq.dies.transferDies": {
        value: () => false, // Default to false
        condition: () => true,
        priority: 70,
      },
      "rfq.dies.blankingDies": {
        value: () => false, // Default to false
        condition: () => true,
        priority: 70,
      },
    },

    "summary-report": {
      "common.customer": {
        value: () => "Sample Customer",
        condition: () => true,
        priority: 60,
      },
      "common.equipment.reel.model": {
        value: (data: PerformanceData) => {
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "48");
          const weight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "4000");
          // Select reel model based on material width and coil weight
          if (width <= 12 && weight <= 5000)
            return "CPR-040";
          if (width <= 24 && weight <= 10000)
            return "CPR-060";
          if (width <= 36 && weight <= 15000)
            return "CPR-080";
          if (width <= 48 && weight <= 20000)
            return "CPR-100";
          if (width <= 60 && weight <= 30000)
            return "CPR-150";
          return "CPR-040"; // Conservative default
        },
        condition: data => !!data?.common?.material?.coilWidth,
        priority: 80,
      },
      "common.equipment.reel.width": {
        value: (data: PerformanceData) => {
          const coilWidth = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "48");
          return Math.ceil(coilWidth / 12) * 12; // Round up to nearest foot
        },
        condition: data => !!data?.common?.material?.coilWidth,
        priority: 80,
      },
      "common.equipment.reel.backplate.diameter": {
        value: (data: PerformanceData) => {
          const coilID = Number.parseFloat(data?.common?.coil?.coilID?.toString() || "20");
          return Math.max(coilID + 4, 24); // Minimum 4" larger than coil ID
        },
        condition: data => !!data?.common?.coil?.coilID,
        priority: 80,
      },
      "reelDrive.reel.motorization.isMotorized": {
        value: (data: PerformanceData) => {
          const pullThru = data?.feed?.feed?.pullThru?.isPullThru;
          const application = data?.feed?.feed?.application;
          const lineType = data?.common?.equipment?.feed?.lineType;

          // Motorized for pull through configurations
          if (pullThru === "Yes")
            return "Yes";

          // Motorized for specific standalone configurations
          if (application === "Standalone") {
            return (lineType === "Reel-Motorized"
              || lineType === "Straightener-Reel Combination")
              ? "Yes"
              : "No";
          }

          return "No";
        },
        condition: () => true,
        priority: 85,
      },
      // Standalone line type specific defaults
      "common.equipment.feed.typeOfLine": {
        value: (data: PerformanceData) => {
          const application = data?.feed?.feed?.application;
          const lineType = data?.common?.equipment?.feed?.lineType;

          if (application === "Standalone" && lineType) {
            // Map standalone line types to appropriate configuration names
            switch (lineType) {
              case "Feed": return "Standalone Feed Line";
              case "Feed-Shear": return "Feed-Shear Configuration";
              case "Straightener": return "Standalone Straightener";
              case "Reel-Motorized": return "Motorized Reel Configuration";
              case "Reel-Pull Off": return "Pull-Off Reel Configuration";
              case "Straightener-Reel Combination": return "Straightener-Reel Combination";
              case "Threading Table": return "Threading Table Configuration";
              case "Other": return "Custom Configuration";
              default: return lineType;
            }
          }

          // Return computed value for other applications
          const baselineType = data?.common?.equipment?.feed?.typeOfLine;
          return baselineType || "Standard Configuration";
        },
        condition: () => true,
        priority: 85,
      },
    },

    "material-specs": {
      "common.material.materialDensity": {
        value: (data: PerformanceData) => {
          const materialType = data?.common?.material?.materialType?.toString().toLowerCase() || "";
          if (materialType.includes("steel"))
            return 0.284;
          if (materialType.includes("aluminum"))
            return 0.098;
          if (materialType.includes("stainless"))
            return 0.289;
          return 0.284; // Default to steel
        },
        condition: data => !!data?.common?.material?.materialType,
        priority: 80,
      },
      "materialSpecs.material.minBendRadius": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0");
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "50000");
          // R = t * (UTS / (2 * σ_bend)) - Conservative formula
          return thickness * (yieldStrength / (2 * 40000)); // Conservative 40ksi bending stress
        },
        condition: data => !!data?.common?.material?.materialThickness && !!data?.common?.material?.maxYieldStrength,
        priority: 90,
      },
    },

    "str-utility": {
      "common.equipment.straightener.model": {
        value: (data: PerformanceData) => {
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "48");
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.125");

          if (width <= 36) {
            return thickness <= 0.1 ? "STR-250-Light" : "STR-250-Standard";
          }
          else if (width <= 60) {
            return thickness <= 0.1 ? "STR-306-Light" : "STR-306-Standard";
          }
          else {
            return thickness <= 0.1 ? "STR-400-Light" : "STR-400-Standard";
          }
        },
        condition: data => !!data?.common?.material?.coilWidth,
        priority: 80,
      },
      "strUtility.straightener.feedRate": {
        value: (data: PerformanceData) => {
          const avgSpm = Number.parseFloat(data?.common?.feedRates?.average?.spm?.toString() || "30");
          const avgLength = Number.parseFloat(data?.common?.feedRates?.average?.length?.toString() || "12");
          return Math.round(avgSpm * avgLength); // Conservative feed rate
        },
        condition: data => !!data?.common?.feedRates?.average?.spm,
        priority: 75,
      },
      "strUtility.straightener.horsepower": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.125");
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "12");
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "50000");
          // HP = (Force * Speed) / 550, with safety factor
          const estimatedHP = (thickness * width * yieldStrength * 1.5) / 550000;
          return Math.max(5, Math.ceil(estimatedHP)); // Minimum 5 HP
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
    },

    "feed": {
      "common.equipment.feed.direction": {
        value: "Left to Right",
        priority: 60,
      },
      "feed.feed.accelerationRate": {
        value: (data: PerformanceData) => {
          // Conservative acceleration based on material thickness
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.125");
          return Math.max(2, Math.min(8, 10 - thickness * 4)); // 2-8 ft/sec²
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 70,
      },
      "feed.feed.motor.hp": {
        value: (data: PerformanceData) => {
          const reelSpeed = Number.parseFloat(data?.reelDrive?.reel?.motorization?.speed?.toString() || "400");
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "30000");
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          // HP = (Speed * Coil Weight * Width) / 33000 (conservative)
          return Math.round(reelSpeed * coilWeight * width / 33000 * 1.5); // 50% safety factor
        },
        condition: data => !!data?.reelDrive?.reel?.motorization?.speed,
        priority: 85,
      },
      "feed.feed.motor.torque": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "30000");
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          // Conservative torque calculation based on material handling
          return Math.round((coilWeight * width) / 100);
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 80,
      },
      "feed.feed.feedConfiguration": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          if (thickness <= 0.05)
            return "Light Gauge Configuration";
          if (thickness <= 0.125)
            return "Medium Gauge Configuration";
          return "Heavy Gauge Configuration";
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 90,
      },
      "feed.feed.feedRolls.diameter": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          return Math.max(6, Math.round(thickness * 80 * 10) / 10); // 80x thickness minimum
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "feed.feed.feedRolls.material": {
        value: () => "Tool Steel D2",
        condition: () => true,
        priority: 70,
      },
      "feed.feed.feedRolls.hardness": {
        value: () => 58, // HRC
        condition: () => true,
        priority: 70,
      },
      "feed.feed.feedRolls.grip.pressure": {
        value: (data: PerformanceData) => {
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "45000");
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          // Conservative grip pressure: 10-15% of yield strength per inch thickness
          return Math.round(yieldStrength * thickness * 0.12);
        },
        condition: data => !!data?.common?.material?.maxYieldStrength && !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "feed.feed.threading.webGuides.quantity": {
        value: (data: PerformanceData) => {
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          return Math.max(2, Math.ceil(width / 2)); // At least 2, one per 2 feet of width
        },
        condition: data => !!data?.common?.material?.coilWidth,
        priority: 75,
      },
      "feed.feed.threading.webGuides.type": {
        value: () => "Adjustable Side Guides",
        condition: () => true,
        priority: 70,
      },
      "feed.feed.threading.threadingSpeed": {
        value: (data: PerformanceData) => {
          const normalSpeed = Number.parseFloat(data?.reelDrive?.reel?.motorization?.speed?.toString() || "400");
          return Math.round(normalSpeed * 0.1); // 10% of normal line speed
        },
        condition: data => !!data?.reelDrive?.reel?.motorization?.speed,
        priority: 80,
      },
      "feed.feed.servo.positioning.accuracy": {
        value: () => 0.001, // ±0.001" accuracy
        condition: () => true,
        priority: 75,
      },
      "feed.feed.servo.positioning.repeatability": {
        value: () => 0.0005, // ±0.0005" repeatability
        condition: () => true,
        priority: 75,
      },
    },

    "reel-drive": {
      "reelDrive.reel.motorization.driveHorsepower": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "5000");
          const speed = Number.parseFloat(data?.reelDrive?.reel?.motorization?.speed?.toString() || "100");
          // Conservative HP calculation based on inertia and acceleration
          const estimatedHP = (coilWeight * speed) / 10000;
          return Math.max(3, Math.ceil(estimatedHP)); // Minimum 3 HP
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 80,
      },
      "reelDrive.reel.motorization.accelRate": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "5000");
          // Conservative acceleration rate based on coil weight
          return Math.max(5, Math.min(25, 30 - coilWeight / 1000)); // 5-25 fpm/sec
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 75,
      },
    },

    "tddbhd": {
      "tddbhd.coil.coilOD": {
        value: (data: PerformanceData) => Number.parseFloat(data?.common?.coil?.maxCoilOD?.toString() || "60"),
        condition: data => !!data?.common?.coil?.maxCoilOD,
        priority: 90,
      },
      "tddbhd.coil.coilWeight": {
        value: (data: PerformanceData) => Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "4000"),
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 90,
      },
      "tddbhd.reel.webTension.lbs": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "45000");
          return Math.round(yieldStrength * thickness * width * 0.25); // 25% of yield
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "tddbhd.reel.dragBrake.torque": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "4000");
          const coilOD = Number.parseFloat(data?.common?.coil?.maxCoilOD?.toString() || "60");
          return Math.round((coilWeight * coilOD) / 100); // Conservative brake torque
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 80,
      },
      "tddbhd.reel.dragBrake.model": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "2000");
          const coilOD = Number.parseFloat(data?.common?.coil?.maxCoilOD?.toString() || "60");
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");

          // Calculate approximate torque requirement to determine brake model
          // For heavy coils, high OD, or thick materials, use double stage
          const isHighTorque = coilWeight > 2000 || coilOD > 48 || thickness > 0.05;

          if (isHighTorque) {
            return "Failsafe - Double Stage"; // Higher capacity for demanding applications
          }

          // Use proper brake model names from BRAKE_MODEL_OPTIONS
          if (reelModel === "CPR-040") {
            return "Failsafe - Single Stage"; // B1 family for light loads only
          }
          // CPR-060, CPR-080, CPR-100+ (B2 family) - use double stage for higher capacity
          return "Failsafe - Double Stage";
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 70,
      },
      "tddbhd.reel.dragBrake.quantity": {
        value: 1,
        priority: 70,
      },
      "tddbhd.reel.dragBrake.holdingForce": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "2000");
          const coilOD = Number.parseFloat(data?.common?.coil?.maxCoilOD?.toString() || "60");
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");

          // Calculate based on brake model selection logic (same as model selection)
          const isHighTorque = coilWeight > 2000 || coilOD > 48 || thickness > 0.05;
          const baseForce = isHighTorque ? 2385 : 1000; // Double vs Single stage

          // Calculate: baseForce * friction * numBrakePads * brakeDistance * quantity
          // Using: friction=0.35, numBrakePads=2, brakeDistance=12, quantity=1
          return Math.round(baseForce * 0.35 * 2 * 12 * 1);
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 75,
      },
      "tddbhd.reel.dragBrake.psiAirRequired": {
        value: 80,
        priority: 70,
      },
      "tddbhd.reel.airPressureAvailable": {
        value: 80,
        priority: 70,
      },
      "tddbhd.reel.coefficientOfFriction": {
        value: 0.35,
        priority: 70,
      },
      "tddbhd.reel.cylinderBore": {
        value: (data: PerformanceData) => {
          const brakeModel = data?.tddbhd?.reel?.dragBrake?.model || "Failsafe - Single Stage";
          // Match cylinder bore to brake model from lookup tables
          if (brakeModel.includes("Single Stage"))
            return 5;
          if (brakeModel.includes("Double Stage"))
            return 4;
          if (brakeModel.includes("Triple Stage"))
            return 4;
          return 5; // Default
        },
        condition: () => true,
        priority: 70,
      },
      "tddbhd.reel.requiredDecelRate": {
        value: 8,
        priority: 70,
      },
      "tddbhd.reel.brakePadDiameter": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          if (reelModel.includes("040"))
            return 12;
          if (reelModel.includes("150"))
            return 16;
          return 14;
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 75,
      },
      "tddbhd.reel.minMaterialWidth": {
        value: (data: PerformanceData) => {
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          return Math.max(0.5, width * 0.8); // 80% of max width, minimum 0.5"
        },
        condition: data => !!data?.common?.material?.coilWidth,
        priority: 75,
      },
      "tddbhd.reel.confirmedMinWidth": {
        value: true, // Always confirm minimum width to pass checks
        condition: () => true,
        priority: 75,
      },
      "tddbhd.reel.holddown.assy": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          // CPR-040 (H1 family) - use LD_NARROW
          if (reelModel === "CPR-040") {
            return "LD_NARROW";
          }
          // CPR-060, CPR-080 (H2 family) - use LD_STANDARD
          if (reelModel.includes("CPR-060") || reelModel.includes("CPR-080")) {
            return "LD_STANDARD";
          }
          // CPR-100, CPR-150, CPR-200, CPR-300, CPR-400 (H3 family) - use MD
          if (reelModel.includes("CPR-100") || reelModel.includes("CPR-150")
            || reelModel.includes("CPR-200") || reelModel.includes("CPR-300")
            || reelModel.includes("CPR-400")) {
            return "MD";
          }
          // CPR-500, CPR-600 (H4 family) - use HD_Single
          if (reelModel.includes("CPR-500") || reelModel.includes("CPR-600")) {
            return "HD_Single";
          }
          return "LD_NARROW"; // Default fallback
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 70,
      },
      "tddbhd.reel.holddown.cylinder": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          // CPR-040 (H1 family) - use 4in Air
          if (reelModel === "CPR-040") {
            return "4in Air";
          }
          // CPR-060, CPR-080 (H2 family) - use 4in Air or 5in Air
          if (reelModel.includes("CPR-060") || reelModel.includes("CPR-080")) {
            return "4in Air";
          }
          // CPR-100+ (H3 and H4 families) - use Hydraulic
          if (reelModel.includes("CPR-100") || reelModel.includes("CPR-150")
            || reelModel.includes("CPR-200") || reelModel.includes("CPR-300")
            || reelModel.includes("CPR-400") || reelModel.includes("CPR-500")
            || reelModel.includes("CPR-600")) {
            return "Hydraulic";
          }
          return "4in Air"; // Default fallback
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 70,
      },
      "tddbhd.reel.holddown.cylinderPressure": {
        value: (data: PerformanceData) => {
          const cylinderType = data?.tddbhd?.reel?.holddown?.cylinder || "";
          // Hydraulic systems use higher pressure
          if (cylinderType.includes("Hydraulic")) {
            return 750; // Standard hydraulic pressure
          }
          // Air systems use lower pressure
          return 80; // Standard air pressure
        },
        condition: () => true,
        priority: 70,
      },
      "tddbhd.reel.holddown.force.required": {
        value: (data: PerformanceData) => {
          const coilWeight = Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "4000");
          return Math.round(coilWeight * 0.15); // 15% of coil weight
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 80,
      },
      "tddbhd.reel.holddown.force.available": {
        value: (data: PerformanceData) => {
          const required = Math.round(Number.parseFloat(data?.common?.coil?.maxCoilWeight?.toString() || "4000") * 0.15);
          return Math.round(required * 1.5); // 50% safety factor
        },
        condition: data => !!data?.common?.coil?.maxCoilWeight,
        priority: 75,
      },
      "tddbhd.reel.threadingDrive.airClutch": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          // CPR-040 (D1 family) only supports airClutch="No"
          // D2 and D3 families support both "Yes" and "No"
          if (reelModel === "CPR-040") {
            return "No";
          }
          // For D2 and D3 families, default to "Yes" for better torque
          return "Yes";
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 70,
      },
      "tddbhd.reel.threadingDrive.hydThreadingDrive": {
        value: (data: PerformanceData) => {
          const reelModel = data?.common?.equipment?.reel?.model || "";
          // CPR-040 (D1 family) only supports "None"
          if (reelModel === "CPR-040") {
            return "None";
          }
          // For other models, choose appropriate hydraulic drive based on model
          if (reelModel.includes("CPR-060") || reelModel.includes("CPR-080")) {
            return "22 cu in (D-15125)"; // D2 family
          }
          if (reelModel.includes("CPR-100") || reelModel.includes("CPR-150")
            || reelModel.includes("CPR-200") || reelModel.includes("CPR-300")
            || reelModel.includes("CPR-400")) {
            return "22 cu in (D-12689)"; // D3 family
          }
          return "None";
        },
        condition: data => !!data?.common?.equipment?.reel?.model,
        priority: 70,
      },
    },

    "roll-str-backbend": {
      "rollStrBackbend.rollConfiguration": {
        value: (data: PerformanceData) => {
          const numberOfRolls = data?.common?.equipment?.straightener?.numberOfRolls || "7";
          return `${numberOfRolls}-Roll Configuration`;
        },
        condition: data => !!data?.common?.equipment?.straightener?.numberOfRolls,
        priority: 85,
      },
      "rollStrBackbend.straightener.rolls.typeOfRoll": {
        value: (data: PerformanceData) => data?.materialSpecs?.straightener?.rolls?.typeOfRoll || "7 Roll Str. Backbend",
        condition: data => !!data?.materialSpecs?.straightener?.rolls?.typeOfRoll,
        priority: 90,
      },
      "rollStrBackbend.straightener.rollDiameter": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          return Math.max(4, Math.round(thickness * 60 * 10) / 10); // 60x thickness minimum
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "rollStrBackbend.straightener.centerDistance": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const rollDiameter = Math.max(4, Math.round(thickness * 60 * 10) / 10);
          return Math.round(rollDiameter * 1.2 * 10) / 10; // 1.2x roll diameter
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 80,
      },
      "rollStrBackbend.straightener.jackForceAvailable": {
        value: (data: PerformanceData) => {
          const strModel = data?.common?.equipment?.straightener?.model || "";
          if (strModel.includes("250"))
            return 25000;
          if (strModel.includes("306"))
            return 50000;
          return 30000; // Default
        },
        condition: data => !!data?.common?.equipment?.straightener?.model,
        priority: 80,
      },
      "rollStrBackbend.straightener.rolls.backbend.rollers.depthRequired": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          return Math.round(thickness * 0.6 * 1000) / 1000; // 60% of thickness
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "rollStrBackbend.straightener.rolls.backbend.rollers.forceRequired": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const width = Number.parseFloat(data?.common?.material?.coilWidth?.toString() || "3");
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "45000");
          return Math.round(thickness * width * yieldStrength * 0.5); // Conservative force
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
      "rollStrBackbend.straightener.rolls.backbend.rollers.first.height": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const rollDiameter = Math.max(4, Math.round(thickness * 60 * 10) / 10);
          return Math.round((rollDiameter / 2 + thickness * 0.6) * 1000) / 1000;
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 80,
      },
      "rollStrBackbend.straightener.rolls.backbend.rollers.middle.height": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const rollDiameter = Math.max(4, Math.round(thickness * 60 * 10) / 10);
          return Math.round((rollDiameter / 2 + thickness * 0.4) * 1000) / 1000;
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 80,
      },
      "rollStrBackbend.straightener.rolls.backbend.rollers.last.height": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const rollDiameter = Math.max(4, Math.round(thickness * 60 * 10) / 10);
          return Math.round((rollDiameter / 2 + thickness * 0.2) * 1000) / 1000;
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 80,
      },
      "rollStrBackbend.straightener.rolls.backbend.radius.radiusAtYield": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          const yieldStrength = Number.parseFloat(data?.common?.material?.maxYieldStrength?.toString() || "45000");
          const modulus = 29000000; // Steel modulus
          return Math.round((modulus * thickness) / (2 * yieldStrength) * 100) / 100;
        },
        condition: data => !!data?.common?.material?.materialThickness && !!data?.common?.material?.maxYieldStrength,
        priority: 85,
      },
      "rollStrBackbend.straightener.rolls.backbend.radius.comingOffCoil": {
        value: (data: PerformanceData) => {
          const coilOD = Number.parseFloat(data?.common?.coil?.maxCoilOD?.toString() || "60");
          return coilOD / 2; // Radius = diameter / 2
        },
        condition: data => !!data?.common?.coil?.maxCoilOD,
        priority: 80,
      },
      "rollStrBackbend.straightener.rolls.backbend.requiredRollDiameter": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.07");
          return Math.max(4, Math.round(thickness * 60 * 10) / 10);
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
    },

    "shear": {
      "shear.shear.hydraulic.pressure": {
        value: (data: PerformanceData) => {
          const thickness = Number.parseFloat(data?.common?.material?.materialThickness?.toString() || "0.125");
          const tensileStrength = Number.parseFloat(data?.common?.material?.maxTensileStrength?.toString()
            || data?.common?.material?.maxYieldStrength?.toString() || "50000");
          // Conservative shear pressure calculation
          return Math.round(tensileStrength * thickness * 2); // 2x safety factor
        },
        condition: data => !!data?.common?.material?.materialThickness,
        priority: 85,
      },
    },
  };

  /**
   * Validation rules that ensure calculations will pass
   */
  private static readonly VALIDATION_RULES: ValidationRule[] = [
    {
      fieldPath: "common.material.materialThickness",
      validate: value => value > 0 && value <= 2.0, // Reasonable thickness range
      suggest: () => 0.125, // 1/8" is common
      description: "Material thickness must be positive and reasonable",
    },
    {
      fieldPath: "common.material.maxYieldStrength",
      validate: value => value >= 20000 && value <= 200000, // Reasonable yield strength range
      suggest: (data) => {
        const materialType = data?.common?.material?.materialType?.toString().toLowerCase() || "";
        if (materialType.includes("steel"))
          return 50000;
        if (materialType.includes("aluminum"))
          return 35000;
        if (materialType.includes("stainless"))
          return 75000;
        return 50000;
      },
      description: "Yield strength must be within engineering limits",
    },
    {
      fieldPath: "common.material.coilWidth",
      validate: value => value > 0 && value <= 120, // Reasonable width range
      suggest: () => 12, // 12" is common
      description: "Coil width must be positive and within machine limits",
    },
  ];

  /**
   * Get validation-aware autofill suggestions for visible tabs
   */
  public static getValidationAwareAutofill(
    data: PerformanceData,
    visibleTabs: VisibleTab[],
  ): Record<string, any> {
    const suggestions: Record<string, any> = {};
    const visibleTabNames = visibleTabs.map(tab => tab.value);

    // Apply engineering defaults for each visible tab
    for (const tabName of visibleTabNames) {
      const tabDefaults = this.ENGINEERING_DEFAULTS[tabName];
      if (!tabDefaults)
        continue;

      for (const [fieldPath, defaultConfig] of Object.entries(tabDefaults)) {
        // Check if field is already populated
        const currentValue = this.getNestedValue(data, fieldPath);
        if (this.hasMeaningfulValue(currentValue))
          continue;

        // Check condition if specified
        if (defaultConfig.condition && !defaultConfig.condition(data))
          continue;

        // Calculate or get the default value
        const defaultValue = typeof defaultConfig.value === "function"
          ? defaultConfig.value(data)
          : defaultConfig.value;

        // Validate the suggested value
        if (this.validateSuggestedValue(fieldPath, defaultValue, data)) {
          suggestions[fieldPath] = defaultValue;
        }
      }
    }

    // Apply validation rule suggestions for any missing critical fields
    for (const rule of this.VALIDATION_RULES) {
      const currentValue = this.getNestedValue(data, rule.fieldPath);
      if (!this.hasMeaningfulValue(currentValue) || !rule.validate(currentValue, data)) {
        const suggestedValue = typeof rule.suggest === "function"
          ? rule.suggest(data)
          : rule.suggest;

        if (rule.validate(suggestedValue, data)) {
          suggestions[rule.fieldPath] = suggestedValue;
        }
      }
    }

    return suggestions;
  }

  /**
   * Validate a suggested value against rules
   */
  private static validateSuggestedValue(fieldPath: string, value: any, data: PerformanceData): boolean {
    // Find applicable validation rule
    const rule = this.VALIDATION_RULES.find(r => r.fieldPath === fieldPath);
    if (rule) {
      return rule.validate(value, data);
    }

    // Basic validation for numeric fields
    if (typeof value === "number") {
      return value > 0 && isFinite(value);
    }

    // Basic validation for string fields
    if (typeof value === "string") {
      return value.trim().length > 0;
    }

    return true; // Allow other types
  }

  /**
   * Get field suggestions that ensure calculations pass validation
   */
  public static getPassingCalculationValues(
    data: PerformanceData,
    tabName: string,
  ): Record<string, any> {
    const suggestions: Record<string, any> = {};
    const tabDefaults = this.ENGINEERING_DEFAULTS[tabName];

    if (!tabDefaults)
      return suggestions;

    // Sort by priority (higher first)
    const sortedDefaults = Object.entries(tabDefaults)
      .sort(([, a], [, b]) => b.priority - a.priority);

    for (const [fieldPath, defaultConfig] of sortedDefaults) {
      // Check if field needs a value
      const currentValue = this.getNestedValue(data, fieldPath);
      if (this.hasMeaningfulValue(currentValue))
        continue;

      // Check condition
      if (defaultConfig.condition && !defaultConfig.condition(data))
        continue;

      // Calculate value
      const value = typeof defaultConfig.value === "function"
        ? defaultConfig.value(data)
        : defaultConfig.value;

      if (this.validateSuggestedValue(fieldPath, value, data)) {
        suggestions[fieldPath] = value;
      }
    }

    return suggestions;
  }

  /**
   * Check if data has minimum required fields for successful calculations
   */
  public static hasMinimumRequiredData(data: PerformanceData, tabName: string): boolean {
    const application = data?.feed?.feed?.application;
    const lineType = data?.common?.equipment?.feed?.lineType;

    switch (tabName) {
      case "rfq":
        // RFQ can always be auto-filled with defaults
        return true;

      case "summary-report":
        // Summary report can be filled with basic material specs
        return !!(data?.common?.material?.coilWidth || data?.common?.coil?.coilID);

      case "material-specs":
        return !!(data?.common?.material?.materialType
          && data?.common?.material?.materialThickness
          && data?.common?.material?.coilWidth);

      case "str-utility":
        // For Standalone Straightener configurations
        if (application === "Standalone"
          && (lineType === "Straightener" || lineType === "Straightener-Reel Combination")) {
          return !!(data?.common?.material?.materialThickness);
        }
        // For Press Feed/CTL with Conventional + SyncMaster
        return !!(data?.common?.material?.materialThickness
          && data?.common?.equipment?.straightener?.model);

      case "feed":
        // For Standalone Feed configurations
        if (application === "Standalone"
          && (lineType === "Feed" || lineType === "Feed-Shear")) {
          return true; // Can always be filled for standalone feed
        }
        // For Press Feed/CTL configurations
        return !!(data?.common?.feedRates?.average?.spm
          && data?.common?.feedRates?.average?.length);

      case "reel-drive":
        // For Standalone Reel configurations
        if (application === "Standalone"
          && (lineType === "Reel-Motorized" || lineType === "Reel-Pull Off"
            || lineType === "Straightener-Reel Combination")) {
          return !!(data?.common?.coil?.maxCoilWeight);
        }
        // For Press Feed/CTL pull-through configurations
        return !!(data?.common?.coil?.maxCoilWeight
          && data?.common?.equipment?.reel?.model);

      case "tddbhd":
        // For Standalone Threading Table
        if (application === "Standalone" && lineType === "Threading Table") {
          return !!(data?.common?.coil?.maxCoilWeight);
        }
        // For Press Feed/CTL configurations
        return !!(data?.common?.coil?.maxCoilWeight
          && data?.common?.material?.materialThickness);

      case "roll-str-backbend":
        // For any configuration with roll type selected
        return !!(data?.common?.material?.materialThickness
          && data?.materialSpecs?.straightener?.rolls?.typeOfRoll);

      case "shear":
        // For Cut To Length or Standalone Feed-Shear
        if (application === "Cut To Length"
          || (application === "Standalone" && lineType === "Feed-Shear")) {
          return !!(data?.common?.material?.materialThickness
            && data?.common?.material?.maxYieldStrength);
        }
        return false;

      default:
        return false;
    }
  }

  /**
   * Get comprehensive autofill that ensures all visible tabs can calculate successfully
   */
  public static getComprehensiveAutofill(
    data: PerformanceData,
    visibleTabs: VisibleTab[],
  ): Record<string, any> {
    const allSuggestions: Record<string, any> = {};

    // Start with validation-aware suggestions
    const baseSuggestions = this.getValidationAwareAutofill(data, visibleTabs);
    Object.assign(allSuggestions, baseSuggestions);

    // Add tab-specific suggestions for each visible tab
    for (const tab of visibleTabs) {
      const tabSuggestions = this.getPassingCalculationValues(data, tab.value);
      Object.assign(allSuggestions, tabSuggestions);
    }

    return allSuggestions;
  }

  /**
   * Helper: Get nested value from object using dot notation
   */
  private static getNestedValue(obj: any, path: string): any {
    return path.split(".").reduce((current, key) => current?.[key], obj);
  }

  /**
   * Helper: Check if value is meaningful (not empty/default)
   */
  private static hasMeaningfulValue(value: any): boolean {
    if (value === null || value === undefined || value === "") {
      return false;
    }

    // Handle string numbers - convert to number for validation
    if (typeof value === "string") {
      const lowerValue = value.toLowerCase();

      // Check for selection prompts
      if (lowerValue.includes("select")
        || lowerValue.includes("choose")
        || lowerValue.includes("default")
        || lowerValue === "none") {
        return false;
      }

      // Check if it's a numeric string
      const numericValue = Number.parseFloat(value);
      if (!isNaN(numericValue)) {
        return numericValue > 0; // Numeric strings are meaningful if > 0
      }

      // Non-numeric strings are meaningful if not empty
      return value.trim().length > 0;
    }

    if (typeof value === "number") {
      return value > 0;
    }

    // Boolean values and other types are always meaningful
    return true;
  }
}
