import { prisma } from "./prisma";
import { logger } from "./logger";
import {
  MachineConnectionType,
  MachineControllerType,
  MachineType,
  OptionRuleAction,
} from "@prisma/client";
import { __dev__ } from "@/config/config";
import { microsoftService } from "@/services";
import { contextStorage, SYSTEM_CONTEXT } from "@/main/context";

contextStorage.enterWith(SYSTEM_CONTEXT);

// TODO: Move sample & seed data into a json file

// Product Classes
export const sampleProductClasses = [
  // CNC Line (2 levels)
  {
    code: "CNC_MILL",
    name: "CNC Milling Machine",
    description: "High-precision CNC milling machines",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "VMC",
    name: "Vertical Machining Center",
    description: "Vertical spindle CNC mills",
    parentId: "CNC_MILL",
    depth: 1,
    isActive: true,
  },

  // Laser Line (3 levels)
  {
    code: "LASER_SYSTEM",
    name: "Laser System",
    description: "Industrial laser cutting and processing systems",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "LASER_CUTTER",
    name: "Laser Cutter",
    description: "Sheet metal laser cutting systems",
    parentId: "LASER_SYSTEM",
    depth: 1,
    isActive: true,
  },
  {
    code: "FIBER_LASER",
    name: "Fiber Laser Cutter",
    description: "High-speed fiber laser cutting systems",
    parentId: "LASER_CUTTER",
    depth: 2,
    isActive: true,
  },
];

// Global Option Categories
export const sampleOptionCategories = [
  // Shared categories
  {
    name: "Control System",
    description: "CNC control unit and software package",
    allowMultiple: false,
    isActive: true,
  },
  {
    name: "Safety Package",
    description: "Safety equipment and protective systems",
    allowMultiple: true,
    isActive: true,
  },

  // CNC-specific categories
  {
    name: "Spindle",
    description: "Spindle motor configuration and specifications",
    allowMultiple: false,
    isActive: true,
  },
  {
    name: "Work Table",
    description: "Work table size and configuration",
    allowMultiple: false,
    isActive: true,
  },
  {
    name: "Tool Changer",
    description: "Automatic tool changing system",
    allowMultiple: false,
    isActive: true,
  },

  // Laser-specific categories
  {
    name: "Laser Source",
    description: "Laser generator type and power rating",
    allowMultiple: false,
    isActive: true,
  },
  {
    name: "Cutting Bed",
    description: "Cutting table configuration and size",
    allowMultiple: false,
    isActive: true,
  },
  {
    name: "Gas System",
    description: "Assist gas delivery and generation system",
    allowMultiple: false,
    isActive: true,
  },
];

// Global Option Headers
export const sampleOptionHeaders = [
  // Control System options (shared across CNC and Laser)
  {
    categoryName: "Control System",
    name: "Fanuc 31i-Model B",
    code: "CTRL_FANUC_31I",
    description: "Fanuc 31i-Model B CNC control with touchscreen",
  },
  {
    categoryName: "Control System",
    name: "Siemens 840D sl",
    code: "CTRL_SIEMENS_840D",
    description: "Siemens 840D sl with multi-touch panel",
  },
  {
    categoryName: "Control System",
    name: "Beckhoff TwinCAT",
    code: "CTRL_BECKHOFF",
    description: "Beckhoff TwinCAT PC-based control system",
  },

  // Safety Package options (shared)
  {
    categoryName: "Safety Package",
    name: "Light Curtain System",
    code: "SAFETY_LIGHT_CURTAIN",
    description: "Perimeter light curtain safety system",
  },
  {
    categoryName: "Safety Package",
    name: "Emergency Stop Kit",
    code: "SAFETY_ESTOP",
    description: "Emergency stop button kit with lockout",
  },
  {
    categoryName: "Safety Package",
    name: "Safety Interlock Package",
    code: "SAFETY_INTERLOCK",
    description: "Door and guard interlock safety system",
  },

  // Spindle options (CNC-specific)
  {
    categoryName: "Spindle",
    name: "15HP Belt Drive Spindle",
    code: "SPIN_15HP_BELT",
    description: "15HP belt-driven spindle, 8000 RPM max, BT40 taper",
  },
  {
    categoryName: "Spindle",
    name: "25HP Direct Drive Spindle",
    code: "SPIN_25HP_DIRECT",
    description: "25HP direct-drive spindle, 12000 RPM max, BT40 taper",
  },
  {
    categoryName: "Spindle",
    name: "40HP High-Speed Spindle",
    code: "SPIN_40HP_HS",
    description: "40HP high-speed spindle, 18000 RPM max, HSK-A63 taper",
  },

  // Work Table options (CNC-specific)
  {
    categoryName: "Work Table",
    name: '24" x 16" Work Table',
    code: "TABLE_24X16",
    description: "610mm x 410mm work table, 500kg load capacity",
  },
  {
    categoryName: "Work Table",
    name: '32" x 18" Work Table',
    code: "TABLE_32X18",
    description: "810mm x 460mm work table, 750kg load capacity",
  },
  {
    categoryName: "Work Table",
    name: '40" x 24" Work Table',
    code: "TABLE_40X24",
    description: "1020mm x 610mm work table, 1200kg load capacity",
  },

  // Tool Changer options (CNC-specific)
  {
    categoryName: "Tool Changer",
    name: "20-Tool Chain Magazine",
    code: "ATC_20_CHAIN",
    description: "20-position chain-type automatic tool changer",
  },
  {
    categoryName: "Tool Changer",
    name: "30-Tool Umbrella Magazine",
    code: "ATC_30_UMBRELLA",
    description: "30-position umbrella-type tool magazine",
  },

  // Laser Source options (Laser-specific)
  {
    categoryName: "Laser Source",
    name: "3kW Fiber Laser",
    code: "LASER_3KW_FIBER",
    description: "IPG 3kW fiber laser source",
  },
  {
    categoryName: "Laser Source",
    name: "6kW Fiber Laser",
    code: "LASER_6KW_FIBER",
    description: "IPG 6kW high-power fiber laser source",
  },
  {
    categoryName: "Laser Source",
    name: "4kW CO2 Laser",
    code: "LASER_4KW_CO2",
    description: "Coherent 4kW CO2 laser for non-metal materials",
  },

  // Cutting Bed options (Laser-specific)
  {
    categoryName: "Cutting Bed",
    name: "5x10 Shuttle Table",
    code: "BED_5X10_SHUTTLE",
    description: "5' x 10' dual shuttle table system",
  },
  {
    categoryName: "Cutting Bed",
    name: "6x12 Fixed Table",
    code: "BED_6X12_FIXED",
    description: "6' x 12' fixed cutting table",
  },

  // Gas System options (Laser-specific)
  {
    categoryName: "Gas System",
    name: "Dual Gas System",
    code: "GAS_DUAL_O2_N2",
    description: "Automatic oxygen and nitrogen gas switching",
  },
  {
    categoryName: "Gas System",
    name: "Nitrogen Generator Package",
    code: "GAS_N2_GENERATOR",
    description: "On-site nitrogen generation system",
  },
];

// Product Class -> Option Category mappings
export const productClassOptionCategories = [
  // CNC_MILL categories
  {
    productClassCode: "CNC_MILL",
    categoryName: "Control System",
    displayOrder: 1,
    isRequired: true,
  },
  {
    productClassCode: "CNC_MILL",
    categoryName: "Spindle",
    displayOrder: 2,
    isRequired: true,
  },
  {
    productClassCode: "CNC_MILL",
    categoryName: "Work Table",
    displayOrder: 3,
    isRequired: true,
  },
  {
    productClassCode: "CNC_MILL",
    categoryName: "Tool Changer",
    displayOrder: 4,
    isRequired: false,
  },
  {
    productClassCode: "CNC_MILL",
    categoryName: "Safety Package",
    displayOrder: 5,
    isRequired: false,
  },

  // VMC categories (inherits from CNC_MILL but can have different settings)
  {
    productClassCode: "VMC",
    categoryName: "Control System",
    displayOrder: 1,
    isRequired: true,
  },
  {
    productClassCode: "VMC",
    categoryName: "Spindle",
    displayOrder: 2,
    isRequired: true,
  },
  {
    productClassCode: "VMC",
    categoryName: "Work Table",
    displayOrder: 3,
    isRequired: true,
  },
  {
    productClassCode: "VMC",
    categoryName: "Tool Changer",
    displayOrder: 4,
    isRequired: true, // Different from CNC_MILL - required for VMC
  },
  {
    productClassCode: "VMC",
    categoryName: "Safety Package",
    displayOrder: 5,
    isRequired: false,
  },

  // LASER_SYSTEM categories
  {
    productClassCode: "LASER_SYSTEM",
    categoryName: "Control System",
    displayOrder: 3, // Different order than CNC
    isRequired: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    categoryName: "Laser Source",
    displayOrder: 1,
    isRequired: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    categoryName: "Cutting Bed",
    displayOrder: 2,
    isRequired: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    categoryName: "Gas System",
    displayOrder: 4,
    isRequired: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    categoryName: "Safety Package",
    displayOrder: 5,
    isRequired: true, // Required for laser systems
  },

  // LASER_CUTTER categories
  {
    productClassCode: "LASER_CUTTER",
    categoryName: "Control System",
    displayOrder: 3,
    isRequired: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryName: "Laser Source",
    displayOrder: 1,
    isRequired: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryName: "Cutting Bed",
    displayOrder: 2,
    isRequired: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryName: "Gas System",
    displayOrder: 4,
    isRequired: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryName: "Safety Package",
    displayOrder: 5,
    isRequired: true,
  },

  // FIBER_LASER categories
  {
    productClassCode: "FIBER_LASER",
    categoryName: "Control System",
    displayOrder: 3,
    isRequired: true,
  },
  {
    productClassCode: "FIBER_LASER",
    categoryName: "Laser Source",
    displayOrder: 1,
    isRequired: true,
  },
  {
    productClassCode: "FIBER_LASER",
    categoryName: "Cutting Bed",
    displayOrder: 2,
    isRequired: true,
  },
  {
    productClassCode: "FIBER_LASER",
    categoryName: "Gas System",
    displayOrder: 4,
    isRequired: true,
  },
  {
    productClassCode: "FIBER_LASER",
    categoryName: "Safety Package",
    displayOrder: 5,
    isRequired: true,
  },
];

// Option Details (pricing and availability per product class)
export const sampleOptionDetails = [
  // Control System pricing (shared options, different prices per product)
  {
    productClassCode: "CNC_MILL",
    optionCode: "CTRL_FANUC_31I",
    price: "25000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "CTRL_SIEMENS_840D",
    price: "35000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "CTRL_BECKHOFF",
    price: "28000.00",
    displayOrder: 3,
    isDefault: false,
  },

  {
    productClassCode: "VMC",
    optionCode: "CTRL_FANUC_31I",
    price: "27000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "VMC",
    optionCode: "CTRL_SIEMENS_840D",
    price: "37000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "CTRL_BECKHOFF",
    price: "30000.00",
    displayOrder: 3,
    isDefault: false,
  },

  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "CTRL_FANUC_31I",
    price: "22000.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "CTRL_SIEMENS_840D",
    price: "32000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "CTRL_BECKHOFF",
    price: "24000.00",
    displayOrder: 3,
    isDefault: true,
  },

  {
    productClassCode: "LASER_CUTTER",
    optionCode: "CTRL_FANUC_31I",
    price: "20000.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "CTRL_SIEMENS_840D",
    price: "30000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "CTRL_BECKHOFF",
    price: "22000.00",
    displayOrder: 3,
    isDefault: true,
  },

  {
    productClassCode: "FIBER_LASER",
    optionCode: "CTRL_FANUC_31I",
    price: "18000.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "CTRL_SIEMENS_840D",
    price: "28000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "CTRL_BECKHOFF",
    price: "20000.00",
    displayOrder: 3,
    isDefault: true,
  },

  // Safety Package pricing (different availability/defaults per product)
  {
    productClassCode: "CNC_MILL",
    optionCode: "SAFETY_LIGHT_CURTAIN",
    price: "8000.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "SAFETY_ESTOP",
    price: "1200.00",
    displayOrder: 2,
    isDefault: true,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "SAFETY_INTERLOCK",
    price: "3500.00",
    displayOrder: 3,
    isDefault: false,
  },

  {
    productClassCode: "VMC",
    optionCode: "SAFETY_LIGHT_CURTAIN",
    price: "8500.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "SAFETY_ESTOP",
    price: "1300.00",
    displayOrder: 2,
    isDefault: true,
  },
  {
    productClassCode: "VMC",
    optionCode: "SAFETY_INTERLOCK",
    price: "3800.00",
    displayOrder: 3,
    isDefault: true,
  },

  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "SAFETY_LIGHT_CURTAIN",
    price: "12000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "SAFETY_ESTOP",
    price: "1500.00",
    displayOrder: 2,
    isDefault: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "SAFETY_INTERLOCK",
    price: "4500.00",
    displayOrder: 3,
    isDefault: true,
  },

  {
    productClassCode: "LASER_CUTTER",
    optionCode: "SAFETY_LIGHT_CURTAIN",
    price: "11000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "SAFETY_ESTOP",
    price: "1400.00",
    displayOrder: 2,
    isDefault: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "SAFETY_INTERLOCK",
    price: "4200.00",
    displayOrder: 3,
    isDefault: true,
  },

  {
    productClassCode: "FIBER_LASER",
    optionCode: "SAFETY_LIGHT_CURTAIN",
    price: "10500.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "SAFETY_ESTOP",
    price: "1350.00",
    displayOrder: 2,
    isDefault: true,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "SAFETY_INTERLOCK",
    price: "4000.00",
    displayOrder: 3,
    isDefault: true,
  },

  // CNC-specific options
  {
    productClassCode: "CNC_MILL",
    optionCode: "SPIN_15HP_BELT",
    price: "12000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "SPIN_25HP_DIRECT",
    price: "28000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "SPIN_40HP_HS",
    price: "45000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "TABLE_24X16",
    price: "0.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "TABLE_32X18",
    price: "8500.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "TABLE_40X24",
    price: "15000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "ATC_20_CHAIN",
    price: "18000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "CNC_MILL",
    optionCode: "ATC_30_UMBRELLA",
    price: "25000.00",
    displayOrder: 2,
    isDefault: false,
  },

  {
    productClassCode: "VMC",
    optionCode: "SPIN_15HP_BELT",
    price: "14000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "VMC",
    optionCode: "SPIN_25HP_DIRECT",
    price: "30000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "SPIN_40HP_HS",
    price: "48000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "TABLE_24X16",
    price: "0.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "VMC",
    optionCode: "TABLE_32X18",
    price: "9000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "TABLE_40X24",
    price: "16000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "ATC_20_CHAIN",
    price: "20000.00",
    displayOrder: 1,
    isDefault: false,
  },
  {
    productClassCode: "VMC",
    optionCode: "ATC_30_UMBRELLA",
    price: "27000.00",
    displayOrder: 2,
    isDefault: true,
  },

  // Laser-specific options
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "LASER_3KW_FIBER",
    price: "45000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "LASER_6KW_FIBER",
    price: "75000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "LASER_4KW_CO2",
    price: "55000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "BED_5X10_SHUTTLE",
    price: "35000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "BED_6X12_FIXED",
    price: "25000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "GAS_DUAL_O2_N2",
    price: "8500.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_SYSTEM",
    optionCode: "GAS_N2_GENERATOR",
    price: "45000.00",
    displayOrder: 2,
    isDefault: false,
  },

  {
    productClassCode: "LASER_CUTTER",
    optionCode: "LASER_3KW_FIBER",
    price: "42000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "LASER_6KW_FIBER",
    price: "72000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "LASER_4KW_CO2",
    price: "52000.00",
    displayOrder: 3,
    isDefault: false,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "BED_5X10_SHUTTLE",
    price: "32000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "BED_6X12_FIXED",
    price: "22000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "GAS_DUAL_O2_N2",
    price: "7500.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "LASER_CUTTER",
    optionCode: "GAS_N2_GENERATOR",
    price: "42000.00",
    displayOrder: 2,
    isDefault: false,
  },

  {
    productClassCode: "FIBER_LASER",
    optionCode: "LASER_3KW_FIBER",
    price: "40000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "LASER_6KW_FIBER",
    price: "70000.00",
    displayOrder: 2,
    isDefault: false,
  },
  // Note: CO2 laser not available for FIBER_LASER product class
  {
    productClassCode: "FIBER_LASER",
    optionCode: "BED_5X10_SHUTTLE",
    price: "30000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "BED_6X12_FIXED",
    price: "20000.00",
    displayOrder: 2,
    isDefault: false,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "GAS_DUAL_O2_N2",
    price: "7000.00",
    displayOrder: 1,
    isDefault: true,
  },
  {
    productClassCode: "FIBER_LASER",
    optionCode: "GAS_N2_GENERATOR",
    price: "40000.00",
    displayOrder: 2,
    isDefault: false,
  },
];

// Simple Option Rules
export const sampleOptionRules = [
  {
    name: "High-Speed Spindle Requires Large Table",
    description: "40HP spindles require larger work tables for stability",
    action: "REQUIRE",
    priority: 100,
    isActive: true,
    condition: {
      type: "SIMPLE",
      conditionType: "OPTION",
      id: "SPIN_40HP_HS", // This will be replaced with actual option ID during seeding
    },
  },
  {
    name: "Small Table Excludes Umbrella Tool Changer",
    description: "24x16 table doesn't have clearance for umbrella magazine",
    action: "DISABLE",
    priority: 200,
    isActive: true,
    condition: {
      type: "SIMPLE",
      conditionType: "OPTION",
      id: "TABLE_24X16", // This will be replaced with actual option ID during seeding
    },
  },
  {
    name: "High-Power Laser Requires Nitrogen Generator",
    description: "6kW lasers benefit from nitrogen generation systems",
    action: "REQUIRE",
    priority: 100,
    isActive: true,
    condition: {
      type: "SIMPLE",
      conditionType: "OPTION",
      id: "LASER_6KW_FIBER", // This will be replaced with actual option ID during seeding
    },
  },
  {
    name: "CO2 Laser Excludes Nitrogen Generator",
    description: "CO2 lasers don't benefit from nitrogen generation",
    action: "DISABLE",
    priority: 150,
    isActive: true,
    condition: {
      type: "SIMPLE",
      conditionType: "OPTION",
      id: "LASER_4KW_CO2", // This will be replaced with actual option ID during seeding
    },
  },
];

export const sampleOptionRuleTargets = [
  {
    ruleName: "High-Speed Spindle Requires Large Table",
    optionCode: "TABLE_40X24",
  },
  {
    ruleName: "Small Table Excludes Umbrella Tool Changer",
    optionCode: "ATC_30_UMBRELLA",
  },
  {
    ruleName: "High-Power Laser Requires Nitrogen Generator",
    optionCode: "GAS_N2_GENERATOR",
  },
  {
    ruleName: "CO2 Laser Excludes Nitrogen Generator",
    optionCode: "GAS_N2_GENERATOR",
  },
];

export const sampleOptionRuleTriggers = [
  {
    ruleName: "High-Speed Spindle Requires Large Table",
    optionCode: "SPIN_40HP_HS",
  },
  {
    ruleName: "Small Table Excludes Umbrella Tool Changer",
    optionCode: "TABLE_24X16",
  },
  {
    ruleName: "High-Power Laser Requires Nitrogen Generator",
    optionCode: "LASER_6KW_FIBER",
  },
  {
    ruleName: "CO2 Laser Excludes Nitrogen Generator",
    optionCode: "LASER_4KW_CO2",
  },
];

// Sample Companies
export const sampleCompanies = [
  {
    name: "Precision Manufacturing Solutions",
    website: "https://www.precisionmfg.com",
    email: "info@precisionmfg.com",
    phone: "(555) 123-4567",
    fax: "(555) 123-4568",
    industry: "MANUFACTURING",
    yearFounded: 1995,
    revenue: 25000000,
    employeeCount: "150-200",
    customerSince: new Date("2020-03-15"),
    paymentTerms: "Net 30",
    creditLimit: 500000,
    taxId: "12-3456789",
    logoUrl: "https://example.com/logos/precision-mfg.png",
    notes:
      "High-volume automotive parts manufacturer. Looking to expand into aerospace.",
    tags: ["customer", "dealer"],
    status: "ACTIVE",
  },
  {
    name: "Advanced Metalworks Inc.",
    website: "https://www.advancedmetalworks.com",
    email: "sales@advancedmetalworks.com",
    phone: "(555) 234-5678",
    fax: "(555) 234-5679",
    industry: "MANUFACTURING",
    yearFounded: 1988,
    revenue: 45000000,
    employeeCount: "300-400",
    customerSince: new Date("2018-07-22"),
    paymentTerms: "Net 45",
    creditLimit: 750000,
    taxId: "98-7654321",
    logoUrl: "https://example.com/logos/advanced-metalworks.png",
    notes:
      "Specializes in custom metal fabrication and welding. Strong relationship with construction industry.",
    tags: ["customer", "dealer"],
    status: "ACTIVE",
  },
  {
    name: "Innovation Engineering Corp.",
    website: "https://www.innovationeng.com",
    email: "contact@innovationeng.com",
    phone: "(555) 345-6789",
    fax: "(555) 345-6790",
    industry: "MANUFACTURING",
    yearFounded: 2005,
    revenue: 18000000,
    employeeCount: "75-100",
    customerSince: new Date("2021-11-08"),
    paymentTerms: "Net 30",
    creditLimit: 300000,
    taxId: "45-6789012",
    logoUrl: "https://example.com/logos/innovation-eng.png",
    notes:
      "R&D-focused company developing new manufacturing processes. Frequent early adopter of new technology.",
    tags: ["customer", "dealer"],
    status: "ACTIVE",
  },
  {
    name: "Heritage Tool & Die",
    website: "https://www.heritagetool.com",
    email: "info@heritagetool.com",
    phone: "(555) 456-7890",
    fax: "(555) 456-7891",
    industry: "MANUFACTURING",
    yearFounded: 1972,
    revenue: 12000000,
    employeeCount: "50-75",
    customerSince: new Date("2019-05-14"),
    paymentTerms: "Net 30",
    creditLimit: 250000,
    taxId: "67-8901234",
    logoUrl: "https://example.com/logos/heritage-tool.png",
    notes:
      "Family-owned tool and die shop. Conservative approach to new equipment purchases.",
    tags: ["customer"],
    status: "ACTIVE",
  },
  {
    name: "Global Aerospace Components",
    website: "https://www.globalaerospace.com",
    email: "procurement@globalaerospace.com",
    phone: "(555) 567-8901",
    fax: "(555) 567-8902",
    industry: "MANUFACTURING",
    yearFounded: 1990,
    revenue: 85000000,
    employeeCount: "500-750",
    customerSince: new Date("2017-09-30"),
    paymentTerms: "Net 60",
    creditLimit: 1500000,
    taxId: "23-4567890",
    logoUrl: "https://example.com/logos/global-aerospace.png",
    notes:
      "Major aerospace supplier. Requires strict quality certifications and documentation.",
    tags: ["dealer"],
    status: "ACTIVE",
  },
];

// Sample Journeys
export const sampleJourneys = [
  // Precision Manufacturing Solutions - 1 journey
  {
    companyName: "Precision Manufacturing Solutions",
    name: "CNC Mill Expansion Project",
    status: "ACTIVE",
    type: "STAMPING",
    source: "WEBSITE",
    priority: "HIGH",
    confidence: 85,
    notes:
      "Looking to add 2 new CNC mills for increased production capacity. Currently evaluating VMC options.",
    startDate: new Date("2024-01-15"),
  },

  // Advanced Metalworks Inc. - 2 journeys
  {
    companyName: "Advanced Metalworks Inc.",
    name: "Laser Cutting System Upgrade",
    status: "ACTIVE",
    type: "CTL",
    source: "REFERRAL",
    priority: "MEDIUM",
    confidence: 70,
    notes:
      "Replacing 15-year-old laser system. Interested in fiber laser technology for improved efficiency.",
    startDate: new Date("2024-02-10"),
  },
  {
    companyName: "Advanced Metalworks Inc.",
    name: "Additional CNC Mill Purchase",
    status: "ACTIVE",
    type: "STAMPING",
    source: "EVENT",
    priority: "LOW",
    confidence: 45,
    notes:
      "Considering additional CNC mill for new product line. Early stages of evaluation.",
    startDate: new Date("2024-03-01"),
  },

  // Innovation Engineering Corp. - 1 journey
  {
    companyName: "Innovation Engineering Corp.",
    name: "R&D Laser System",
    status: "ACTIVE",
    type: "CTL",
    source: "SOCIAL_MEDIA",
    priority: "HIGH",
    confidence: 90,
    notes:
      "Developing new laser cutting processes. Need high-precision fiber laser system for research.",
    startDate: new Date("2024-01-20"),
  },

  // Heritage Tool & Die - 0 journeys (none)

  // Global Aerospace Components - 1 journey
  {
    companyName: "Global Aerospace Components",
    name: "Production Line Expansion",
    status: "ACTIVE",
    type: "STAMPING",
    source: "REFERRAL",
    priority: "CRITICAL",
    confidence: 95,
    notes:
      "Major aerospace contract requires additional production capacity. Need 3 VMC systems with full automation.",
    startDate: new Date("2024-02-28"),
  },
];

// Sample Items (Spare Parts & Equipment)
export const sampleItems = [
  // Parts
  {
    name: "BT40 Spindle Taper",
    description: "BT40 spindle taper for CNC milling machines",
    unitPrice: 450.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "End Mill Set",
    description: 'Assorted end mill set (1/4", 3/8", 1/2")',
    unitPrice: 450.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "Fiber Laser Cutting Head",
    description: "Replacement cutting head for fiber laser systems",
    unitPrice: 8500.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "Fanuc Control Panel",
    description: "Replacement touchscreen control panel",
    unitPrice: 3500.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "Emergency Stop Button",
    description: "Replacement emergency stop button with lockout",
    unitPrice: 180.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "T-Slot Clamp Set",
    description: "Complete T-slot clamping kit for work tables",
    unitPrice: 280.0,
    type: "parts",
    isActive: true,
  },
  {
    name: "Way Oil (5 Gallon)",
    description: "5-gallon container of way oil for machine lubrication",
    unitPrice: 85.0,
    type: "parts",
    isActive: true,
  },

  // Services
  {
    name: "CAD/CAM Software License",
    description: "Annual license for CAD/CAM software",
    unitPrice: 2500.0,
    type: "services",
    isActive: true,
  },
  {
    name: "Training Package",
    description: "On-site operator training package (2 days)",
    unitPrice: 1800.0,
    type: "services",
    isActive: true,
  },
  {
    name: "Installation Service",
    description: "Professional machine installation and setup",
    unitPrice: 2500.0,
    type: "services",
    isActive: true,
  },
  {
    name: "Preventive Maintenance",
    description: "Annual preventive maintenance service contract",
    unitPrice: 3500.0,
    type: "services",
    isActive: true,
  },
  {
    name: "Technical Support",
    description: "Remote technical support and troubleshooting",
    unitPrice: 200.0,
    type: "services",
    isActive: true,
  },
];

// Sample Configurations
export const sampleConfigurations = [
  // CNC Milling Machine - Basic Configuration
  {
    productClassCode: "CNC_MILL",
    name: "Standard CNC Mill",
    description: "Basic CNC milling machine with standard features",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_FANUC_31I",
      "SPIN_15HP_BELT",
      "TABLE_24X16",
      "ATC_20_CHAIN",
      "SAFETY_ESTOP",
    ],
  },
  // CNC Milling Machine - High Performance Configuration
  {
    productClassCode: "CNC_MILL",
    name: "High-Performance CNC Mill",
    description: "Advanced CNC milling machine with premium features",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_SIEMENS_840D",
      "SPIN_40HP_HS",
      "TABLE_40X24",
      "ATC_30_UMBRELLA",
      "SAFETY_LIGHT_CURTAIN",
      "SAFETY_INTERLOCK",
    ],
  },
  // VMC - Production Configuration
  {
    productClassCode: "VMC",
    name: "Production VMC",
    description: "Vertical machining center optimized for production",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_FANUC_31I",
      "SPIN_25HP_DIRECT",
      "TABLE_32X18",
      "ATC_30_UMBRELLA",
      "SAFETY_ESTOP",
      "SAFETY_INTERLOCK",
    ],
  },
  // Laser System - Standard Configuration
  {
    productClassCode: "LASER_SYSTEM",
    name: "Standard Laser System",
    description: "Basic laser cutting system with standard features",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_BECKHOFF",
      "LASER_3KW_FIBER",
      "BED_5X10_SHUTTLE",
      "GAS_DUAL_O2_N2",
      "SAFETY_LIGHT_CURTAIN",
      "SAFETY_ESTOP",
      "SAFETY_INTERLOCK",
    ],
  },
  // Laser Cutter - High Power Configuration
  {
    productClassCode: "LASER_CUTTER",
    name: "High-Power Laser Cutter",
    description: "High-power laser cutting system for thick materials",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_SIEMENS_840D",
      "LASER_6KW_FIBER",
      "BED_6X12_FIXED",
      "GAS_N2_GENERATOR",
      "SAFETY_LIGHT_CURTAIN",
      "SAFETY_ESTOP",
      "SAFETY_INTERLOCK",
    ],
  },
  // Fiber Laser - Compact Configuration
  {
    productClassCode: "FIBER_LASER",
    name: "Compact Fiber Laser",
    description: "Compact fiber laser system for small shops",
    isTemplate: true,
    isActive: true,
    selectedOptionCodes: [
      "CTRL_BECKHOFF",
      "LASER_3KW_FIBER",
      "BED_5X10_SHUTTLE",
      "GAS_DUAL_O2_N2",
      "SAFETY_LIGHT_CURTAIN",
      "SAFETY_ESTOP",
      "SAFETY_INTERLOCK",
    ],
  },
];

const seedSampleData = async () => {
  try {
    // scripts/000_create_system_employee.ts  (run once, before any other seed)
    await prisma.$transaction(async (tx) => {
      // 1. user row
      await tx.user.upsert({
        where: { id: "system-user" },
        create: {
          id: "system-user",
          username: "system",
          role: "ADMIN",
          isActive: true,
        },
        update: {}, // nothing to update
      });

      // 2. employee row => **id is literally "system"**
      await tx.employee.upsert({
        where: { id: "system" },
        create: {
          id: "system",
          userId: "system-user",
          number: "SYS",
          firstName: "System",
          lastName: "Account",
          jobTitle: "Seeder",
          // the audit columns can point to itself
          createdById: "system",
          updatedById: "system",
        },
        update: {}, // no‑op
      });
    });

    // Get the first employee to use as createdBy
    const firstEmployee = await prisma.employee.findFirst();
    if (!firstEmployee) {
      logger.warn("No employees found. Skipping company seeding.");
      return;
    }

    // Seed companies
    const createdCompanies = new Map();
    for (const company of sampleCompanies) {
      const existing = await prisma.company.findFirst({
        where: { name: company.name },
      });

      if (!existing) {
        const created = await prisma.company.create({
          data: {
            ...company,
            industry: company.industry as any,
            status: company.status as any,
            createdById: "system",
            updatedById: "system",
          },
        });
        createdCompanies.set(company.name, created.id);
        logger.info(`Company "${company.name}" created`);
      } else {
        createdCompanies.set(company.name, existing.id);
      }
    }

    // Seed journeys
    for (const journey of sampleJourneys) {
      const companyId = createdCompanies.get(journey.companyName);

      if (companyId) {
        const existing = await prisma.journey.findFirst({
          where: {
            customerId: companyId,
            name: journey.name,
          },
        });

        if (!existing) {
          await prisma.journey.create({
            data: {
              customerId: companyId,
              name: journey.name,
              status: journey.status as any,
              type: journey.type as any,
              source: journey.source as any,
              priority: journey.priority as any,
              confidence: journey.confidence,
              notes: journey.notes,
              startDate: journey.startDate,
              createdById: "system",
              updatedById: "system",
            },
          });
          logger.info(
            `Journey "${journey.name}" for ${journey.companyName} created`
          );
        }
      }
    }

    // Seed product classes in order (parents first)
    const createdProductClasses = new Map();

    for (const productClass of sampleProductClasses) {
      const existing = await prisma.productClass.findUnique({
        where: { code: productClass.code },
      });

      if (!existing) {
        // If this has a parent, get the actual parent ID
        let parentId = null;
        if (productClass.parentId) {
          const parent = await prisma.productClass.findUnique({
            where: { code: productClass.parentId },
          });
          parentId = parent?.id || null;
        }

        const created = await prisma.productClass.create({
          data: {
            ...productClass,
            parentId,
            createdById: "system",
            updatedById: "system",
          },
        });
        createdProductClasses.set(productClass.code, created.id);
        logger.info(`Product class ${productClass.code} created`);
      } else {
        createdProductClasses.set(productClass.code, existing.id);
      }
    }

    // Seed option categories (global categories)
    const createdCategories = new Map();
    for (const category of sampleOptionCategories) {
      const existing = await prisma.optionCategory.findUnique({
        where: { name: category.name },
      });

      if (!existing) {
        const created = await prisma.optionCategory.create({
          data: {
            ...category,
            createdById: "system",
            updatedById: "system",
          },
        });
        createdCategories.set(category.name, created.id);
        logger.info(`Option category ${category.name} created`);
      } else {
        createdCategories.set(category.name, existing.id);
      }
    }

    // Create ProductClassOptionCategory relationships
    for (const mapping of productClassOptionCategories) {
      const productClass = await prisma.productClass.findUnique({
        where: { code: mapping.productClassCode },
      });

      if (productClass) {
        const category = await prisma.optionCategory.findUnique({
          where: { name: mapping.categoryName },
        });

        if (category) {
          const existing = await prisma.productClassOptionCategory.findUnique({
            where: {
              productClassId_optionCategoryId: {
                productClassId: productClass.id,
                optionCategoryId: category.id,
              },
            },
          });

          if (!existing) {
            await prisma.productClassOptionCategory.create({
              data: {
                productClassId: productClass.id,
                optionCategoryId: category.id,
                displayOrder: mapping.displayOrder,
                isRequired: mapping.isRequired,
                createdById: "system",
                updatedById: "system",
              },
            });
            logger.info(
              `ProductClassOptionCategory ${mapping.productClassCode} -> ${mapping.categoryName} created`
            );
          }
        }
      }
    }

    // Seed option headers (global options)
    const createdOptionHeaders = new Map();
    for (const optionHeader of sampleOptionHeaders) {
      const existing = await prisma.optionHeader.findUnique({
        where: { code: optionHeader.code },
      });

      if (!existing) {
        const category = await prisma.optionCategory.findUnique({
          where: { name: optionHeader.categoryName },
        });

        if (category) {
          const { categoryName, ...optionData } = optionHeader;
          const created = await prisma.optionHeader.create({
            data: {
              ...optionData,
              categoryId: category.id,
              createdById: "system",
              updatedById: "system",
            },
          });
          createdOptionHeaders.set(optionHeader.code, created.id);
          logger.info(`Option header ${optionHeader.code} created`);
        }
      } else {
        createdOptionHeaders.set(optionHeader.code, existing.id);
      }
    }

    // Seed option details (pricing per product class)
    for (const optionDetail of sampleOptionDetails) {
      const productClass = await prisma.productClass.findUnique({
        where: { code: optionDetail.productClassCode },
      });

      const optionHeader = await prisma.optionHeader.findUnique({
        where: { code: optionDetail.optionCode },
      });

      if (productClass && optionHeader) {
        const existing = await prisma.optionDetails.findUnique({
          where: {
            productClassId_optionHeaderId: {
              productClassId: productClass.id,
              optionHeaderId: optionHeader.id,
            },
          },
        });

        if (!existing) {
          await prisma.optionDetails.create({
            data: {
              productClassId: productClass.id,
              optionHeaderId: optionHeader.id,
              price: optionDetail.price,
              displayOrder: optionDetail.displayOrder,
              isActive: true,
              isDefault: optionDetail.isDefault,
              createdById: "system",
              updatedById: "system",
            },
          });
          logger.info(
            `Option detail ${optionDetail.productClassCode} -> ${optionDetail.optionCode} created`
          );
        }
      }
    }

    // Seed option rules
    const createdRules = new Map();
    for (const rule of sampleOptionRules) {
      const existing = await prisma.optionRule.findFirst({
        where: { name: rule.name },
      });

      if (!existing) {
        // Replace option codes with actual option IDs in the condition
        let condition = rule.condition;
        if (
          condition.type === "SIMPLE" &&
          condition.conditionType === "OPTION"
        ) {
          const optionHeader = await prisma.optionHeader.findUnique({
            where: { code: condition.id },
          });
          if (optionHeader) {
            condition = {
              ...condition,
              id: optionHeader.id,
            };
          }
        }

        const created = await prisma.optionRule.create({
          data: {
            name: rule.name,
            description: rule.description,
            action: rule.action as OptionRuleAction,
            priority: rule.priority,
            isActive: rule.isActive,
            condition: condition,
            createdById: "system",
            updatedById: "system",
          },
        });
        createdRules.set(rule.name, created.id);
        logger.info(`Option rule "${rule.name}" created`);
      } else {
        createdRules.set(rule.name, existing.id);
      }
    }

    // Create option rule targets
    for (const target of sampleOptionRuleTargets) {
      const ruleId = createdRules.get(target.ruleName);
      const optionHeader = await prisma.optionHeader.findUnique({
        where: { code: target.optionCode },
      });

      if (ruleId && optionHeader) {
        const existing = await prisma.optionRuleTarget.findUnique({
          where: {
            ruleId_optionId: {
              ruleId: ruleId,
              optionId: optionHeader.id,
            },
          },
        });

        if (!existing) {
          await prisma.optionRuleTarget.create({
            data: {
              ruleId: ruleId,
              optionId: optionHeader.id,
              createdById: "system",
              updatedById: "system",
            },
          });
          logger.info(
            `Option rule target: ${target.ruleName} -> ${target.optionCode}`
          );
        }
      }
    }

    // Create option rule triggers
    for (const trigger of sampleOptionRuleTriggers) {
      const ruleId = createdRules.get(trigger.ruleName);
      const optionHeader = await prisma.optionHeader.findUnique({
        where: { code: trigger.optionCode },
      });

      if (ruleId && optionHeader) {
        const existing = await prisma.optionRuleTrigger.findUnique({
          where: {
            ruleId_optionId: {
              ruleId: ruleId,
              optionId: optionHeader.id,
            },
          },
        });

        if (!existing) {
          await prisma.optionRuleTrigger.create({
            data: {
              ruleId: ruleId,
              optionId: optionHeader.id,
              createdById: "system",
              updatedById: "system",
            },
          });
          logger.info(
            `Option rule trigger: ${trigger.ruleName} -> ${trigger.optionCode}`
          );
        }
      }
    }

    // Seed items (spare parts & equipment)
    if (firstEmployee) {
      for (const item of sampleItems) {
        const existing = await prisma.item.findFirst({
          where: { name: item.name },
        });

        if (!existing) {
          await prisma.item.create({
            data: {
              ...item,
              createdById: "system",
              updatedById: "system",
            },
          });
          logger.info(`Item "${item.name}" created`);
        }
      }
    }

    // Seed configurations
    for (const config of sampleConfigurations) {
      const productClass = await prisma.productClass.findUnique({
        where: { code: config.productClassCode },
      });

      if (productClass) {
        const existing = await prisma.configuration.findFirst({
          where: {
            productClassId: productClass.id,
            name: config.name,
          },
        });

        if (!existing) {
          const { productClassCode, selectedOptionCodes, ...configData } =
            config;

          const createdConfig = await prisma.configuration.create({
            data: {
              ...configData,
              productClassId: productClass.id,
              createdById: "system",
              updatedById: "system",
            },
          });

          // Create configuration options
          for (const optionCode of selectedOptionCodes) {
            const optionHeader = await prisma.optionHeader.findUnique({
              where: { code: optionCode },
            });

            if (optionHeader) {
              await prisma.configurationOption.create({
                data: {
                  configurationId: createdConfig.id,
                  optionId: optionHeader.id,
                  createdById: "system",
                  updatedById: "system",
                },
              });
            }
          }

          logger.info(`Configuration "${config.name}" created`);
        }
      }
    }
  } catch (error) {
    logger.error("Error during sample data seeding:", error);
    throw error;
  }
};

const machines = [
  {
    slug: "mazak-200",
    name: "Mazak 200",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.83",
    connectionPort: 5000,
  },
  {
    slug: "mazak-350",
    name: "Mazak 350",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.53",
    connectionPort: 5000,
  },
  {
    slug: "mazak-450",
    name: "Mazak 450",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.MAZAK,
    connectionType: MachineConnectionType.MTCONNECT,
    connectionHost: "192.231.64.45",
    connectionPort: 5000,
  },
  {
    slug: "doosan",
    name: "Doosan 3100LS",
    type: MachineType.LATHE,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.127",
    connectionPort: 8193,
  },
  {
    slug: "kuraki",
    name: "Kuraki Boring Mill",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "x.x.x.x",
    connectionPort: 8193,
  },
  {
    slug: "okk",
    name: "OKK",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.203",
    connectionPort: 8193,
  },
  {
    slug: "niigata-hn80",
    name: "Niigata HN80",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.202",
    connectionPort: 8193,
  },
  {
    slug: "niigata-spn63",
    name: "Niigata SPN63",
    type: MachineType.MILL,
    controllerType: MachineControllerType.FANUC,
    connectionType: MachineConnectionType.FOCAS,
    connectionHost: "192.231.64.201",
    connectionPort: 8193,
  },
];

const seedMachines = async () => {
  try {
    for (const machine of machines) {
      const existing = await prisma.machine.findUnique({
        where: { slug: machine.slug },
      });

      if (!existing) {
        await prisma.machine.create({
          data: {
            ...machine,
            createdById: "system",
            updatedById: "system",
          },
        });
        logger.info(`Machine ${machine.slug} created`);
      }
    }
  } catch (error) {
    logger.error("Error during machine seeding:", error);
  }
};

const seed = async () => {
  await microsoftService.sync();
  await seedMachines();

  if (__dev__) {
    await seedSampleData();
  }

  logger.info("All seeding completed successfully");
  process.exit(0);
};

seed().catch((error) => {
  logger.error("Fatal error during seeding:", error);
  process.exit(1);
});
