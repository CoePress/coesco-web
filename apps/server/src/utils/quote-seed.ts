import { prisma } from "./prisma";
import { logger } from "./logger";

export const sampleProductClasses = [
  // DEPTH 0 - Root Categories
  {
    code: "CNC_MILL",
    name: "CNC Milling Machine",
    description:
      "High-precision CNC milling machines for metal fabrication and prototyping",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "LASER_CUTTER",
    name: "Laser Cutting System",
    description:
      "Industrial fiber and CO2 laser cutting systems for sheet metal and non-metal materials",
    parentId: null,
    depth: 0,
    isActive: true,
  },
  {
    code: "INJECTION_MOLD",
    name: "Injection Molding Machine",
    description:
      "Precision injection molding systems for thermoplastic manufacturing",
    parentId: null,
    depth: 0,
    isActive: true,
  },

  // DEPTH 1 - Subcategories
  {
    code: "CNC_MILL_VMC",
    name: "Vertical Machining Center",
    description:
      "Vertical spindle CNC mills with automatic tool changing capabilities",
    parentId: "CNC_MILL",
    depth: 1,
    isActive: true,
  },
  {
    code: "LASER_FIBER",
    name: "Fiber Laser Cutter",
    description:
      "High-speed fiber laser cutting systems optimized for metal cutting",
    parentId: "LASER_CUTTER",
    depth: 1,
    isActive: true,
  },

  // DEPTH 2 - Sub-subcategory
  {
    code: "CNC_MILL_VMC_5AXIS",
    name: "5-Axis Vertical Machining Center",
    description:
      "Advanced 5-axis simultaneous VMC with tilting spindle head and rotary table",
    parentId: "CNC_MILL_VMC",
    depth: 2,
    isActive: true,
  },
];

export const sampleOptionCategories = [
  // CNC MILLING MACHINE Categories
  {
    name: "Spindle Configuration",
    description: "Spindle motor power and speed specifications",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Table Size",
    description: "Work table dimensions and load capacity",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Control System",
    description: "CNC control unit and software package",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Tool Management",
    description: "Automatic tool changer and tool storage options",
    isRequired: false,
    allowMultiple: false,
    displayOrder: 4,
    isActive: true,
  },
  {
    name: "Coolant System",
    description: "Coolant delivery and filtration systems",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 5,
    isActive: true,
  },

  // LASER CUTTING Categories
  {
    name: "Laser Source",
    description: "Laser generator type and power rating",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Cutting Bed",
    description: "Cutting table size and material handling system",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Assist Gas System",
    description: "Gas delivery system for cutting assistance",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Fume Extraction",
    description: "Smoke and fume removal systems",
    isRequired: false,
    allowMultiple: false,
    displayOrder: 4,
    isActive: true,
  },
  {
    name: "Automation Package",
    description: "Material loading and unloading automation",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 5,
    isActive: true,
  },

  // INJECTION MOLDING Categories
  {
    name: "Clamping Force",
    description: "Machine clamping tonnage and platen size",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Injection Unit",
    description: "Screw diameter and injection pressure specifications",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 2,
    isActive: true,
  },
  {
    name: "Heating System",
    description: "Barrel heating zones and temperature control",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 3,
    isActive: true,
  },
  {
    name: "Mold Handling",
    description: "Mold installation and quick-change systems",
    isRequired: false,
    allowMultiple: false,
    displayOrder: 4,
    isActive: true,
  },
  {
    name: "Quality Control",
    description: "In-process monitoring and quality assurance systems",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 5,
    isActive: true,
  },

  // VERTICAL MACHINING CENTER Specific Categories
  {
    name: "Axis Configuration",
    description: "Machine axis travel and positioning accuracy",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Workholding",
    description: "Vises, chucks, and fixture mounting systems",
    isRequired: false,
    allowMultiple: true,
    displayOrder: 6,
    isActive: true,
  },

  // FIBER LASER Specific Categories
  {
    name: "Beam Delivery",
    description: "Fiber optic beam delivery and cutting head options",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Material Handling",
    description: "Sheet loading, positioning, and removal systems",
    isRequired: false,
    allowMultiple: false,
    displayOrder: 6,
    isActive: true,
  },

  // 5-AXIS VMC Categories
  {
    name: "Rotary Axes",
    description: "A and B axis rotary table and tilting head configurations",
    isRequired: true,
    allowMultiple: false,
    displayOrder: 1,
    isActive: true,
  },
  {
    name: "Probing System",
    description: "Touch probe and measurement systems for 5-axis work",
    isRequired: false,
    allowMultiple: false,
    displayOrder: 7,
    isActive: true,
  },
];

export const sampleOptions = [
  // CNC MILLING MACHINE Options
  // Spindle Configuration
  {
    name: "15HP Belt Drive Spindle",
    code: "SPINDLE_15HP_BELT",
    description: "15HP belt-driven spindle, 50-8000 RPM, BT40 taper",
    price: 12000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Spindle Configuration",
  },
  {
    name: "25HP Direct Drive Spindle",
    code: "SPINDLE_25HP_DIRECT",
    description: "25HP direct-drive spindle, 100-12000 RPM, BT40 taper",
    price: 28000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Spindle Configuration",
  },
  {
    name: "40HP High-Speed Spindle",
    code: "SPINDLE_40HP_HS",
    description: "40HP high-speed spindle, 200-18000 RPM, HSK-A63 taper",
    price: 45000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Spindle Configuration",
  },

  // Table Size
  {
    name: '24" x 16" Table',
    code: "TABLE_24X16",
    description: "610mm x 410mm table, 500kg load capacity",
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Table Size",
  },
  {
    name: '32" x 18" Table',
    code: "TABLE_32X18",
    description: "810mm x 460mm table, 750kg load capacity",
    price: 8500.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Table Size",
  },
  {
    name: '40" x 24" Table',
    code: "TABLE_40X24",
    description: "1020mm x 610mm table, 1200kg load capacity",
    price: 15000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Table Size",
  },

  // Control System
  {
    name: "Fanuc 31i-Model B",
    code: "CTRL_FANUC_31I",
    description: 'Fanuc 31i-Model B CNC control with 15" touchscreen',
    price: 25000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Control System",
  },
  {
    name: "Siemens 840D sl",
    code: "CTRL_SIEMENS_840D",
    description: 'Siemens 840D sl with 19" multi-touch panel',
    price: 35000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Control System",
  },
  {
    name: "Heidenhain TNC 640",
    code: "CTRL_HEIDENHAIN_640",
    description: "Heidenhain TNC 640 conversational programming control",
    price: 42000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Control System",
  },

  // Tool Management
  {
    name: "20-Tool Chain Magazine",
    code: "ATC_20_CHAIN",
    description: "20-position chain-type automatic tool changer",
    price: 18000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Tool Management",
  },
  {
    name: "30-Tool Umbrella Magazine",
    code: "ATC_30_UMBRELLA",
    description: "30-position umbrella-type tool magazine with random access",
    price: 25000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Tool Management",
  },
  {
    name: "60-Tool Side Mount Magazine",
    code: "ATC_60_SIDE",
    description: "60-position side-mounted tool magazine with tool presetter",
    price: 48000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Tool Management",
  },

  // Coolant System
  {
    name: "Flood Coolant System",
    code: "COOLANT_FLOOD",
    description: "High-pressure flood coolant with 200L tank and filtration",
    price: 4500.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Coolant System",
  },
  {
    name: "Through-Spindle Coolant",
    code: "COOLANT_TSC",
    description: "Through-spindle coolant delivery system, 70 bar pressure",
    price: 12000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Coolant System",
  },
  {
    name: "Mist Coolant System",
    code: "COOLANT_MIST",
    description: "Minimal quantity lubrication (MQL) mist system",
    price: 6800.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Coolant System",
  },

  // LASER CUTTING Options
  // Laser Source
  {
    name: "3kW Fiber Laser",
    code: "LASER_3KW_FIBER",
    description: "IPG 3kW fiber laser source with 10-year warranty",
    price: 45000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Laser Source",
  },
  {
    name: "6kW Fiber Laser",
    code: "LASER_6KW_FIBER",
    description: "IPG 6kW fiber laser source with advanced beam quality",
    price: 75000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Laser Source",
  },
  {
    name: "12kW Fiber Laser",
    code: "LASER_12KW_FIBER",
    description: "IPG 12kW high-power fiber laser for thick material cutting",
    price: 125000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Laser Source",
  },
  {
    name: "4kW CO2 Laser",
    code: "LASER_4KW_CO2",
    description: "Coherent 4kW CO2 laser for non-metal materials",
    price: 55000.0,
    displayOrder: 4,
    isDefault: false,
    isActive: true,
    categoryName: "Laser Source",
  },

  // Cutting Bed
  {
    name: "5' x 10' Shuttle Table",
    code: "BED_5X10_SHUTTLE",
    description: "5' x 10' dual shuttle table system with exchange capability",
    price: 35000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Cutting Bed",
  },
  {
    name: "6' x 12' Fixed Table",
    code: "BED_6X12_FIXED",
    description: "6' x 12' fixed cutting table with pneumatic supports",
    price: 25000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Cutting Bed",
  },
  {
    name: "8' x 16' Large Format",
    code: "BED_8X16_LARGE",
    description: "8' x 16' large format table with tube cutting attachment",
    price: 85000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Cutting Bed",
  },

  // Assist Gas System
  {
    name: "Dual Gas System (O2/N2)",
    code: "GAS_DUAL_O2_N2",
    description: "Automatic oxygen and nitrogen gas switching system",
    price: 8500.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Assist Gas System",
  },
  {
    name: "Triple Gas System (O2/N2/Air)",
    code: "GAS_TRIPLE",
    description: "Three-gas system with compressed air for low-cost cutting",
    price: 12000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Assist Gas System",
  },
  {
    name: "Nitrogen Generator Package",
    code: "GAS_N2_GENERATOR",
    description: "On-site nitrogen generation system for cost savings",
    price: 45000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Assist Gas System",
  },

  // Fume Extraction
  {
    name: "Standard Downdraft",
    code: "FUME_DOWNDRAFT",
    description: "Below-table fume extraction with baghouse filtration",
    price: 15000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Fume Extraction",
  },
  {
    name: "High-Efficiency Filtration",
    code: "FUME_HEPA",
    description: "HEPA filtration system for fine particulate removal",
    price: 28000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Fume Extraction",
  },

  // Automation Package
  {
    name: "Sheet Loader",
    code: "AUTO_SHEET_LOADER",
    description: "Automatic sheet material loading system up to 6000kg",
    price: 65000.0,
    displayOrder: 1,
    isDefault: false,
    isActive: true,
    categoryName: "Automation Package",
  },
  {
    name: "Part Sorting System",
    code: "AUTO_PART_SORT",
    description: "Automated part sorting and stacking system",
    price: 45000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Automation Package",
  },

  // INJECTION MOLDING Options
  // Clamping Force
  {
    name: "150 Ton Clamp",
    code: "CLAMP_150T",
    description: '150-ton hydraulic clamping unit with 24" x 24" platens',
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Clamping Force",
  },
  {
    name: "300 Ton Clamp",
    code: "CLAMP_300T",
    description: '300-ton hydraulic clamping with 32" x 32" platens',
    price: 45000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Clamping Force",
  },
  {
    name: "500 Ton Clamp",
    code: "CLAMP_500T",
    description: "500-ton electric-hydraulic hybrid clamp system",
    price: 95000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Clamping Force",
  },

  // Injection Unit
  {
    name: "50mm Screw Unit",
    code: "INJ_50MM",
    description: "50mm diameter reciprocating screw, 280cm³ shot size",
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Injection Unit",
  },
  {
    name: "70mm Screw Unit",
    code: "INJ_70MM",
    description: "70mm diameter screw with barrier mixing design, 550cm³ shot",
    price: 25000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Injection Unit",
  },
  {
    name: "90mm Screw Unit",
    code: "INJ_90MM",
    description: "90mm large capacity screw unit, 900cm³ maximum shot size",
    price: 48000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Injection Unit",
  },

  // Heating System
  {
    name: "5-Zone Electric Heating",
    code: "HEAT_5ZONE",
    description: "5-zone electric barrel heating with PID temperature control",
    price: 8000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Heating System",
  },
  {
    name: "7-Zone Ceramic Heaters",
    code: "HEAT_7ZONE_CERAMIC",
    description: "7-zone ceramic band heaters with faster heat-up times",
    price: 15000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Heating System",
  },

  // Mold Handling
  {
    name: "Manual Mold Setup",
    code: "MOLD_MANUAL",
    description: "Manual mold installation with standard clamp system",
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Mold Handling",
  },
  {
    name: "Quick Mold Change",
    code: "MOLD_QUICK_CHANGE",
    description: "Magnetic mold clamping for rapid mold changeover",
    price: 22000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Mold Handling",
  },

  // Quality Control
  {
    name: "In-Mold Weight Monitoring",
    code: "QC_WEIGHT_MON",
    description: "Real-time shot weight monitoring and control system",
    price: 18000.0,
    displayOrder: 1,
    isDefault: false,
    isActive: true,
    categoryName: "Quality Control",
  },
  {
    name: "Cavity Pressure Monitoring",
    code: "QC_CAVITY_PRESSURE",
    description: "Multi-cavity pressure monitoring with data logging",
    price: 32000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Quality Control",
  },

  // VERTICAL MACHINING CENTER Specific Options
  // Axis Configuration
  {
    name: '24" x 16" x 20" Travel',
    code: "AXIS_24_16_20",
    description: "610 x 410 x 510mm axis travel with ±0.005mm positioning",
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Axis Configuration",
  },
  {
    name: '32" x 18" x 24" Travel',
    code: "AXIS_32_18_24",
    description: "810 x 460 x 610mm travel with linear scale feedback",
    price: 15000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Axis Configuration",
  },
  {
    name: '40" x 24" x 28" Travel',
    code: "AXIS_40_24_28",
    description: "1020 x 610 x 710mm travel with thermal compensation",
    price: 28000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Axis Configuration",
  },

  // Workholding
  {
    name: '6" Precision Vise Package',
    code: "WORK_VISE_6IN",
    description: 'Kurt 6" precision vise with soft jaws and stop kit',
    price: 2800.0,
    displayOrder: 1,
    isDefault: false,
    isActive: true,
    categoryName: "Workholding",
  },
  {
    name: "Hydraulic Workholding Kit",
    code: "WORK_HYDRAULIC",
    description: "Hydraulic workholding system with fixture plates",
    price: 8500.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Workholding",
  },
  {
    name: "4th Axis Rotary Table",
    code: "WORK_4TH_AXIS",
    description: "CNC 4th axis rotary table with tailstock support",
    price: 25000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Workholding",
  },

  // FIBER LASER Specific Options
  // Beam Delivery
  {
    name: "Standard Cutting Head",
    code: "BEAM_STD_HEAD",
    description: "Auto-focus cutting head with ceramic nozzle protection",
    price: 0.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Beam Delivery",
  },
  {
    name: "High-Power Cutting Head",
    code: "BEAM_HP_HEAD",
    description: "High-power cutting head for thick material processing",
    price: 15000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Beam Delivery",
  },
  {
    name: "Welding Head Package",
    code: "BEAM_WELD_HEAD",
    description: "Fiber laser welding head with wire feed capability",
    price: 28000.0,
    displayOrder: 3,
    isDefault: false,
    isActive: true,
    categoryName: "Beam Delivery",
  },

  // Material Handling
  {
    name: "Pneumatic Sheet Support",
    code: "MAT_PNEUMATIC",
    description: "Pneumatic sheet support system with ball transfer units",
    price: 12000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Material Handling",
  },
  {
    name: "Magnetic Sheet Lifter",
    code: "MAT_MAGNETIC_LIFT",
    description: "Magnetic sheet handling system for ferrous materials",
    price: 22000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Material Handling",
  },

  // 5-AXIS VMC Options
  // Rotary Axes
  {
    name: "Tilting Head A-Axis",
    code: "ROTARY_TILT_HEAD",
    description: "±120° tilting spindle head with direct drive A-axis",
    price: 85000.0,
    displayOrder: 1,
    isDefault: true,
    isActive: true,
    categoryName: "Rotary Axes",
  },
  {
    name: "Trunnion Table AB-Axes",
    code: "ROTARY_TRUNNION",
    description: "360° continuous B-axis with ±120° A-axis trunnion table",
    price: 125000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Rotary Axes",
  },

  // Probing System
  {
    name: "Touch Probe System",
    code: "PROBE_TOUCH",
    description: "Renishaw touch probe with part and tool measurement cycles",
    price: 18000.0,
    displayOrder: 1,
    isDefault: false,
    isActive: true,
    categoryName: "Probing System",
  },
  {
    name: "Laser Tool Setter",
    code: "PROBE_LASER_TOOL",
    description: "Non-contact laser tool measurement and breakage detection",
    price: 35000.0,
    displayOrder: 2,
    isDefault: false,
    isActive: true,
    categoryName: "Probing System",
  },
];

export const sampleOptionRules = [
  // CNC Mill Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "SPINDLE_40HP_HS",
    targetOptionCode: "COOLANT_TSC",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "TABLE_24X16",
    targetOptionCode: "ATC_60_SIDE",
  },
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "CTRL_HEIDENHAIN_640",
    targetOptionCode: "ATC_30_UMBRELLA",
  },

  // Laser Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "LASER_12KW_FIBER",
    targetOptionCode: "FUME_HEPA",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "LASER_4KW_CO2",
    targetOptionCode: "GAS_N2_GENERATOR",
  },
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "BED_8X16_LARGE",
    targetOptionCode: "AUTO_SHEET_LOADER",
  },

  // Injection Molding Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "CLAMP_500T",
    targetOptionCode: "INJ_90MM",
  },
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "INJ_90MM",
    targetOptionCode: "HEAT_7ZONE_CERAMIC",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "CLAMP_150T",
    targetOptionCode: "INJ_90MM",
  },

  // VMC Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "AXIS_40_24_28",
    targetOptionCode: "TABLE_40X24",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "WORK_4TH_AXIS",
    targetOptionCode: "WORK_HYDRAULIC",
  },

  // Fiber Laser Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "BEAM_WELD_HEAD",
    targetOptionCode: "LASER_6KW_FIBER",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "MAT_MAGNETIC_LIFT",
    targetOptionCode: "GAS_N2_GENERATOR",
  },

  // 5-Axis Rules
  {
    ruleType: "REQUIRES",
    triggerOptionCode: "ROTARY_TRUNNION",
    targetOptionCode: "PROBE_TOUCH",
  },
  {
    ruleType: "EXCLUDES",
    triggerOptionCode: "ROTARY_TILT_HEAD",
    targetOptionCode: "ROTARY_TRUNNION",
  },
];

export const sampleConfigurations = [
  {
    name: "Entry Level CNC Mill",
    description: "Basic CNC milling setup for small shops and education",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL",
    selectedOptionCodes: [
      "SPINDLE_15HP_BELT",
      "TABLE_24X16",
      "CTRL_FANUC_31I",
      "ATC_20_CHAIN",
      "COOLANT_FLOOD",
    ],
  },
  {
    name: "Production CNC Mill",
    description: "High-performance milling configuration for production work",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL",
    selectedOptionCodes: [
      "SPINDLE_25HP_DIRECT",
      "TABLE_32X18",
      "CTRL_SIEMENS_840D",
      "ATC_30_UMBRELLA",
      "COOLANT_TSC",
      "COOLANT_MIST",
    ],
  },
  {
    name: "Standard VMC Configuration",
    description: "Balanced vertical machining center for general purpose work",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL_VMC",
    selectedOptionCodes: [
      "SPINDLE_25HP_DIRECT",
      "TABLE_32X18",
      "CTRL_FANUC_31I",
      "AXIS_32_18_24",
      "ATC_30_UMBRELLA",
      "COOLANT_FLOOD",
      "WORK_VISE_6IN",
    ],
  },
  {
    name: "5-Axis Production Center",
    description: "Advanced 5-axis machining center for complex aerospace parts",
    isTemplate: true,
    isActive: true,
    productClassCode: "CNC_MILL_VMC_5AXIS",
    selectedOptionCodes: [
      "SPINDLE_40HP_HS",
      "TABLE_32X18",
      "CTRL_HEIDENHAIN_640",
      "AXIS_32_18_24",
      "ROTARY_TILT_HEAD",
      "ATC_30_UMBRELLA",
      "COOLANT_TSC",
      "PROBE_TOUCH",
    ],
  },
  {
    name: "Basic Fiber Laser",
    description: "Entry-level fiber laser cutting system for sheet metal",
    isTemplate: true,
    isActive: true,
    productClassCode: "LASER_FIBER",
    selectedOptionCodes: [
      "LASER_3KW_FIBER",
      "BED_5X10_SHUTTLE",
      "GAS_DUAL_O2_N2",
      "BEAM_STD_HEAD",
      "FUME_DOWNDRAFT",
      "MAT_PNEUMATIC",
    ],
  },
  {
    name: "High-Production Fiber Laser",
    description: "Automated fiber laser system for high-volume production",
    isTemplate: true,
    isActive: true,
    productClassCode: "LASER_FIBER",
    selectedOptionCodes: [
      "LASER_6KW_FIBER",
      "BED_8X16_LARGE",
      "GAS_N2_GENERATOR",
      "BEAM_HP_HEAD",
      "FUME_HEPA",
      "AUTO_SHEET_LOADER",
      "AUTO_PART_SORT",
      "MAT_MAGNETIC_LIFT",
    ],
  },
  {
    name: "Compact Injection Molder",
    description: "Small tonnage injection molding for precision parts",
    isTemplate: true,
    isActive: true,
    productClassCode: "INJECTION_MOLD",
    selectedOptionCodes: [
      "CLAMP_150T",
      "INJ_50MM",
      "HEAT_5ZONE",
      "MOLD_MANUAL",
    ],
  },
  {
    name: "Production Injection Molder",
    description: "Medium tonnage system with quality monitoring",
    isTemplate: true,
    isActive: true,
    productClassCode: "INJECTION_MOLD",
    selectedOptionCodes: [
      "CLAMP_300T",
      "INJ_70MM",
      "HEAT_7ZONE_CERAMIC",
      "MOLD_QUICK_CHANGE",
      "QC_WEIGHT_MON",
      "QC_CAVITY_PRESSURE",
    ],
  },
  {
    name: "High-Volume Injection System",
    description: "Large tonnage system for automotive and appliance parts",
    isTemplate: true,
    isActive: true,
    productClassCode: "INJECTION_MOLD",
    selectedOptionCodes: [
      "CLAMP_500T",
      "INJ_90MM",
      "HEAT_7ZONE_CERAMIC",
      "MOLD_QUICK_CHANGE",
      "QC_WEIGHT_MON",
    ],
  },
];

// Product Class -> Option Category mappings
export const productClassOptionCategories = [
  {
    productClassCode: "CNC_MILL",
    categoryNames: [
      "Spindle Configuration",
      "Table Size",
      "Control System",
      "Tool Management",
      "Coolant System",
    ],
  },
  {
    productClassCode: "LASER_CUTTER",
    categoryNames: [
      "Laser Source",
      "Cutting Bed",
      "Assist Gas System",
      "Fume Extraction",
      "Automation Package",
    ],
  },
  {
    productClassCode: "INJECTION_MOLD",
    categoryNames: [
      "Clamping Force",
      "Injection Unit",
      "Heating System",
      "Mold Handling",
      "Quality Control",
    ],
  },
  {
    productClassCode: "CNC_MILL_VMC",
    categoryNames: [
      "Spindle Configuration",
      "Table Size",
      "Control System",
      "Axis Configuration",
      "Tool Management",
      "Coolant System",
      "Workholding",
    ],
  },
  {
    productClassCode: "LASER_FIBER",
    categoryNames: [
      "Laser Source",
      "Cutting Bed",
      "Assist Gas System",
      "Beam Delivery",
      "Fume Extraction",
      "Automation Package",
      "Material Handling",
    ],
  },
  {
    productClassCode: "CNC_MILL_VMC_5AXIS",
    categoryNames: [
      "Spindle Configuration",
      "Table Size",
      "Control System",
      "Axis Configuration",
      "Rotary Axes",
      "Tool Management",
      "Coolant System",
      "Workholding",
      "Probing System",
    ],
  },
];

const seedQuoteData = async () => {
  try {
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
          data: { ...productClass, parentId },
        });
        createdProductClasses.set(productClass.code, created.id);
        logger.info(`Product class ${productClass.code} created`);
      } else {
        createdProductClasses.set(productClass.code, existing.id);
      }
    }

    // Seed option categories
    const createdCategories = new Map();
    for (const category of sampleOptionCategories) {
      const existing = await prisma.optionCategory.findFirst({
        where: { name: category.name },
      });

      if (!existing) {
        const created = await prisma.optionCategory.create({ data: category });
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
        for (const categoryName of mapping.categoryNames) {
          const category = await prisma.optionCategory.findFirst({
            where: { name: categoryName },
          });

          if (category) {
            const existing = await prisma.productClassOptionCategory.findUnique(
              {
                where: {
                  productClassId_optionCategoryId: {
                    productClassId: productClass.id,
                    optionCategoryId: category.id,
                  },
                },
              }
            );

            if (!existing) {
              await prisma.productClassOptionCategory.create({
                data: {
                  productClassId: productClass.id,
                  optionCategoryId: category.id,
                },
              });
              logger.info(
                `ProductClassOptionCategory ${mapping.productClassCode} -> ${categoryName} created`
              );
            }
          }
        }
      }
    }

    // Seed options
    const createdOptions = new Map();
    for (const option of sampleOptions) {
      const existing = await prisma.option.findFirst({
        where: { code: option.code },
      });

      if (!existing) {
        const category = await prisma.optionCategory.findFirst({
          where: { name: option.categoryName },
        });

        if (category) {
          const { categoryName, ...optionData } = option;
          const created = await prisma.option.create({
            data: { ...optionData, categoryId: category.id },
          });
          createdOptions.set(option.code, created.id);
          logger.info(`Option ${option.code} created`);
        }
      } else {
        createdOptions.set(option.code, existing.id);
      }
    }

    // Seed option rules
    for (const rule of sampleOptionRules) {
      const triggerOption = await prisma.option.findFirst({
        where: { code: rule.triggerOptionCode },
      });
      const targetOption = await prisma.option.findFirst({
        where: { code: rule.targetOptionCode },
      });

      if (triggerOption && targetOption) {
        const existing = await prisma.optionRule.findFirst({
          where: {
            triggerOptionId: triggerOption.id,
            targetOptionId: targetOption.id,
          },
        });

        if (!existing) {
          await prisma.optionRule.create({
            data: {
              ruleType: rule.ruleType,
              triggerOptionId: triggerOption.id,
              targetOptionId: targetOption.id,
            },
          });
          logger.info(
            `Option rule ${rule.triggerOptionCode} -> ${rule.targetOptionCode} created`
          );
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
            name: config.name,
            productClassId: productClass.id,
          },
        });

        if (!existing) {
          const created = await prisma.configuration.create({
            data: {
              name: config.name,
              description: config.description,
              isTemplate: config.isTemplate,
              isActive: config.isActive,
              productClassId: productClass.id,
            },
          });

          // Add selected options to configuration
          for (const optionCode of config.selectedOptionCodes) {
            const option = await prisma.option.findFirst({
              where: { code: optionCode },
            });

            if (option) {
              await prisma.configurationOption.create({
                data: {
                  configurationId: created.id,
                  optionId: option.id,
                },
              });
            }
          }

          logger.info(`Configuration ${config.name} created`);
        }
      }
    }

    logger.info(
      "Manufacturing equipment sample data seeding completed successfully"
    );
  } catch (error) {
    logger.error("Error during quote data seeding:", error);
    throw error;
  }
};

seedQuoteData();
