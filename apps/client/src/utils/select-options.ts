// Centralized select options for reuse across the app

import { Label } from "recharts";

export const DAYS_PER_WEEK_OPTIONS = [
  { value: "1", label: "1 Day" },
  { value: "2", label: "2 Days" },
  { value: "3", label: "3 Days" },
  { value: "4", label: "4 Days" },
  { value: "5", label: "5 Days" },
  { value: "6", label: "6 Days" },
  { value: "7", label: "7 Days" },
];

export const SHIFTS_PER_DAY_OPTIONS = [
  { value: "1", label: "1 Shift" },
  { value: "2", label: "2 Shifts" },
  { value: "3", label: "3 Shifts" },
];

export const LINE_APPLICATION_OPTIONS = [
  { value: "Press Feed", label: "Press Feed" },
  { value: "Cut to Length", label: "Cut to Length" },
  { value: "Standalone", label: "Standalone" },
];

export const EDGE_TYPE_OPTIONS = [
  { value: "yes", label: "Yes" },
  { value: "no", label: "No" },
  { value: "both", label: "Both" },
];

export const LOADING_OPTIONS = [
  { value: "operatorSide", label: "Operator Side" },
  { value: "nonOperatorSide", label: "Non-Operator Side" },
];

export const PRESS_TYPE_OPTIONS = [
  { value: "mechanical", label: "Mechanical" },
  { value: "hydraulic", label: "Hydraulic" },
  { value: "servo", label: "Servo" },
];

export const DIE_TYPE_OPTIONS = [
  { value: "progressive", label: "Progressive" },
  { value: "transfer", label: "Transfer" },
  { value: "blanking", label: "Blanking" },
];

export const PRESS_APPLICATION_OPTIONS = [
  { value: "pressFeed", label: "Press Feed" },
  { value: "cutToLength", label: "Cut To Length" },
  { value: "standalone", label: "Standalone" },
];

export const VOLTAGE_OPTIONS = [
  { value: "120", label: "120V" },
  { value: "240", label: "240V" },
  { value: "480", label: "480V" },
  { value: "600", label: "600V" },
];

export const FEED_DIRECTION_OPTIONS = [
  { value: "Right to Left", label: "Right to Left" },
  { value: "Left to Right", label: "Left to Right" },
];

export const COIL_LOADING_OPTIONS = [
  { value: "Operator Side", label: "Operator Side" },
  { value: "Non-Operator Side", label: "Non-Operator Side" },
];

export const CONTROLS_LEVEL_OPTIONS = [
  { value: "Mini-Drive System", label: "Mini-Drive System" },
  { value: "Relay Machine", label: "Relay Machine" },
  { value: "SyncMaster", label: "SyncMaster" },
  { value: "IP Indexer Basic", label: "IP Indexer Basic" },
  { value: "Allen Bradley Basic", label: "Allen Bradley Basic" },
  { value: "SyncMaster Plus", label: "SyncMaster Plus" },
  { value: "IP Indexer Plus", label: "IP Indexer Plus" },
  { value: "Allen Bradley Plus", label: "Allen Bradley Plus" },
  { value: "Fully Automatic", label: "Fully Automatic" },
];

export const RFQ_TYPE_OF_LINE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "Conventional", label: "Conventional" },
];

export const TYPE_OF_LINE_OPTIONS = [
  { value: "Compact", label: "Compact" },
  { value: "Compact CTL", label: "Compact CTL" },
  { value: "Conventional", label: "Conventional" },
  { value: "Conventional CTL", label: "Conventional CTL" },
  { value: "Pull Through", label: "Pull Through" },
  { value: "Pull Through Compact", label: "Pull Through Compact" },
  { value: "Pull Through CTL", label: "Pull Through CTL" },
  { value: "Feed", label: "Feed" },
  { value: "Feed-Pull Through", label: "Feed-Pull Through" },
  { value: "Feed-Pull Through-Shear", label: "Feed-Pull Through-Shear" },
  { value: "Feed-Shear", label: "Feed-Shear" },
  { value: "Straightener", label: "Straightener" },
  { value: "Straightener-Reel Combination", label: "Straightener-Reel Combination" },
  { value: "Reel-Motorized", label: "Reel-Motorized" },
  { value: "Reel-Pull Off", label: "Reel-Pull Off" },
  { value: "Threading Table", label: "Threading Table" },
  { value: "Other", label: "Other" },
];

export const PASSLINE_OPTIONS = [
  { value: "none", label: "None" },
  { value: "37", label: "37\"" },
  { value: "39", label: "39\"" },
  { value: "40", label: "40\"" },
  { value: "40.5", label: "40.5\"" },
  { value: "41", label: "41\"" },
  { value: "41.5", label: "41.5\"" },
  { value: "42", label: "42\"" },
  { value: "43", label: "43\"" },
  { value: "43.625", label: "43.625\"" },
  { value: "44", label: "44\"" },
  { value: "45", label: "45\"" },
  { value: "45.5", label: "45.5\"" },
  { value: "46", label: "46\"" },
  { value: "46.5", label: "46.5\"" },
  { value: "47", label: "47\"" },
  { value: "47.4", label: "47.4\"" },
  { value: "47.5", label: "47.5\"" },
  { value: "48", label: "48\"" },
  { value: "48.5", label: "48.5\"" },
  { value: "49", label: "49\"" },
  { value: "49.5", label: "49.5\"" },
  { value: "50", label: "50\"" },
  { value: "50.5", label: "50.5\"" },
  { value: "50.75", label: "50.75\"" },
  { value: "51", label: "51\"" },
  { value: "51.5", label: "51.5\"" },
  { value: "51.75", label: "51.75\"" },
  { value: "52", label: "52\"" },
  { value: "52.25", label: "52.25\"" },
  { value: "52.5", label: "52.5\"" },
  { value: "53", label: "53\"" },
  { value: "54", label: "54\"" },
  { value: "54.5", label: "54.5\"" },
  { value: "54.75", label: "54.75\"" },
  { value: "55", label: "55\"" },
  { value: "55.25", label: "55.25\"" },
  { value: "55.5", label: "55.5\"" },
  { value: "55.75", label: "55.75\"" },
  { value: "56", label: "56\"" },
  { value: "56.5", label: "56.5\"" },
  { value: "57", label: "57\"" },
  { value: "58", label: "58\"" },
  { value: "58.25", label: "58.25\"" },
  { value: "59", label: "59\"" },
  { value: "59.5", label: "59.5\"" },
  { value: "60", label: "60\"" },
  { value: "60.5", label: "60.5\"" },
  { value: "61", label: "61\"" },
  { value: "62", label: "62\"" },
  { value: "62.5", label: "62.5\"" },
  { value: "63", label: "63\"" },
  { value: "64", label: "64\"" },
  { value: "64.5", label: "64.5\"" },
  { value: "65", label: "65\"" },
  { value: "66", label: "66\"" },
  { value: "66.5", label: "66.5\"" },
  { value: "67", label: "67\"" },
  { value: "70", label: "70\"" },
  { value: "72", label: "72\"" },
  { value: "75", label: "75\"" },
  { value: "76", label: "76\"" },
];

export const ROLL_TYPE_OPTIONS = [
  { value: "7 Roll Str. Backbend", label: "7 Roll Str. Backbend" },
  { value: "9 Roll Str. Backbend", label: "9 Roll Str. Backbend" },
  { value: "11 Roll Str. Backbend", label: "11 Roll Str. Backbend" },
];

export const REEL_BACKPLATE_OPTIONS = [
  { value: "Standard Backplate", label: "Standard Backplate" },
  { value: "Full OD Backplate", label: "Full OD Backplate" },
];

export const REEL_STYLE_OPTIONS = [
  { value: "Single Ended", label: "Single Ended" },
  { value: "Double Ended", label: "Double Ended" },
];

export const REEL_HORSEPOWER_OPTIONS = [
  { value: 3, label: "3 HP" },
  { value: 5, label: "5 HP" },
];

export const MATERIAL_TYPE_OPTIONS = [
  { value: "Aluminum", label: "Aluminum" },
  { value: "Galvanized", label: "Galvanized" },
  { value: "HS Steel", label: "HS Steel" },
  { value: "Hot Rolled Steel", label: "Hot Rolled Steel" },
  { value: "Dual Phase", label: "Dual Phase" },
  { value: "Cold Rolled Steel", label: "Cold Rolled Steel" },
  { value: "Sainless Steel", label: "Stainless Steel" },
  { value: "Titanium", label: "Titanium" },
  { value: "Brass", label: "Brass" },
  { value: "Beryl Copper", label: "Beryl Copper" },
];

export const YES_NO_OPTIONS = [
  { value: "No", label: "No" },
  { value: "Yes", label: "Yes" },
]; 

export const REEL_MODEL_OPTIONS = [
  { value: "CPR-040", label: "CPR-040" },
  { value: "CPR-060", label: "CPR-060" },
  { value: "CPR-080", label: "CPR-080" },
  { value: "CPR-100", label: "CPR-100" },
  { value: "CPR-150", label: "CPR-150" },
  { value: "CPR-200", label: "CPR-200" },
  { value: "CPR-300", label: "CPR-300" },
  { value: "CPR-400", label: "CPR-400" },
  { value: "CPR-500", label: "CPR-500" },
  { value: "CPR-600", label: "CPR-600" },
];

export const REEL_WIDTTH_OPTIONS = [
  { value: "24", Label: "24" },
  { value: "30", Label: "30" },
  { value: "36", Label: "36" },
  { value: "42", Label: "42" },
  { value: "48", Label: "48" },
  { value: "54", Label: "54" },
  { value: "60", Label: "60" },
];

export const BACKPLATE_DIAMETER_OPTIONS = [
  { value: "27", Label: "27" },
  { value: "72", Label: "72" },
];

export const HYDRAULIC_THREADING_DRIVE_OPTIONS = [
  { value: "22 cu in (D-12689)", label: "22 cu in (D-12689)" },
  { value: "38 cu in (D-13374)", label: "38 cu in (D-13374)" },
  { value: "60 cu in (D-13374)", label: "60 cu in (D-13374)" },
  { value: "60 cu in (D-13382)", label: "60 cu in (D-13382)" },
];

export const HOLD_DOWN_ASSY_OPTIONS = [
  { value: "SD", label: "SD" },
  { value: "SD_MOTORIZED", label: "SD_MOTORIZED" },
  { value: "MD", label: "MD" },
  { value: "HD_SINGLE", label: "HD_SINGLE" },
  { value: "HD_DUAL", label: "HD_DUAL" },
  { value: "XD", label: "XD" },
  { value: "XXD", label: "XXD" },
];

export const HOLD_DOWN_CYLINDER_OPTIONS = [
  { value: "hydraulic", label: "Hydraulic"},
];

export const BRAKE_MODEL_OPTIONS = [
  { value: "Single Stage", label: "Single Stage" },
  { value: "Double Stage", label: "Double Stage" },
  { value: "Triple Stage", label: "Triple Stage" },
  { value: "Failsafe - Single Stage", label: "Failsafe - Single Stage" },
  { value: "Failsafe - Double Stage", label: "Failsafe - Double Stage" },
];

export const BRAKE_QUANTITY_OPTIONS = [
  { value: "1", label: "1" },
  { value: "2", label: "2" },
  { value: "3", label: "3" },
];

export const PAYOFF_OPTIONS = [
  { value: "TOP", label: "TOP" },
  { value: "BOTTOM", label: "BOTTOM" },
];

export const STR_MODEL_OPTIONS = [
  { value: "CPPS-250", label: "CPPS-250" },
  { value: "CPPS-306", label: "CPPS-306" },
  { value: "CPPS-350", label: "CPPS-350" },
  { value: "CPPS-406", label: "CPPS-406" },
  { value: "CPPS-507", label: "CPPS-507" },
  { value: "SPGPS-810", label: "SPGPS-810" },
];

export const STR_WIDTH_OPTIONS = [
  { value: "24", label: "24\"" },
  { value: "30", label: "30\"" },
  { value: "36", label: "36\"" },
  { value: "42", label: "42\"" },
  { value: "48", label: "48\"" },
  { value: "54", label: "54\"" },
  { value: "60", label: "60\"" },
  { value: "66", label: "66\"" },
  { value: "72", label: "72\"" },
];

export const STR_HORSEPOWER_OPTIONS = [
  { value: "20", label: "20 HP" },
  { value: "25", label: "25 HP" },
  { value: "30", label: "30 HP" },
  { value: "40", label: "40 HP" },
  { value: "50", label: "50 HP" },
];

export const STR_FEED_RATE_OPTIONS = [
  { value: "80", label: "80 FPM" },
  { value: "100", label: "100 FPM" },
  { value: "120", label: "120 FPM" },
  { value: "140", label: "140 FPM" },
  { value: "160", label: "160 FPM" },
  { value: "200", label: "200 FPM" },
];

export const FEED_MODEL_OPTIONS = [
  { value: "sigma-v-feed", label: "Sigma 5 Feed" },
  { value: "sigma-v-straightener", label: "Sigma 5 Feed Pull Thru" },
  { value: "allen-bradley", label: "Allen Bradley" },
];

export const SIGMA_5_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1", label: "CPRF-S1" },
  { value: "CPRF-S1 PLUS", label: "CPRF-S1 PLUS" },
  { value: "CPRF-S2", label: "CPRF-S2" },
  { value: "CPRF-S2 PLUS", label: "CPRF-S2 PLUS" },
  { value: "CPRF-S3", label: "CPRF-S3" },
  { value: "CPRF-S3 PLUS", label: "CPRF-S3 PLUS" },
  { value: "CPRF-S4", label: "CPRF-S4" },
  { value: "CPRF-S4 PLUS", label: "CPRF-S4 PLUS" },
  { value: "CPRF-S5", label: "CPRF-S5" },
  { value: "CPRF-6", label: "CPRF-6" },
  { value: "CPRF-7", label: "CPRF-7" },
  { value: "CPRF-8", label: "CPRF-8" },
];

export const SIGMA_5_PULLTHRU_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1 ES", label: "CPRF-S1 ES" },
  { value: "CPRF-S1 ES PLUS", label: "CPRF-S1 ES PLUS" },
  { value: "CPRF-S2 ES", label: "CPRF-S2 ES" },
  { value: "CPRF-S2 ES PLUS", label: "CPRF-S2 ES PLUS" },
  { value: "CPRF-S3 ES", label: "CPRF-S3 ES" },
  { value: "CPRF-S3 RS", label: "CPRF-S3 RS" },
  { value: "CPRF-S3 RS PLUS", label: "CPRF-S3 RS PLUS" },
  { value: "CPRF-S4 HS", label: "CPRF-S4 HS" },
  { value: "CPRF-S4 HS PLUS", label: "CPRF-S4 HS PLUS" },
  { value: "CPRF-S4 RS", label: "CPRF-S4 RS" },
  { value: "CPRF-S4 RS PLUS", label: "CPRF-S4 RS PLUS" },
  { value: "CPRF-S5-350", label: "CPRF-S5-350" },
  { value: "CPRF-S6-350", label: "CPRF-S6-350" },
  { value: "CPRF-S6-500", label: "CPRF-S6-500" },
  { value: "CPRF-S7-350", label: "CPRF-S7-350" },
  { value: "CPRF-S7-500", label: "CPRF-S7-500" },
  { value: "CPRF-S8-500", label: "CPRF-S8-500" },
];

export const ALLEN_BRADLEY_FEED_MODEL_OPTIONS = [
  { value: "CPRF-S1 MPL", label: "CPRF-S1 MPL" },
  { value: "CPRF-S2 MPL", label: "CPRF-S2 MPL" },
  { value: "CPRF-S3 MPL", label: "CPRF-S3 MPL" },
  { value: "CPRF-S3 MPM", label: "CPRF-S3 MPM" },
  { value: "CPRF-S4 MPL", label: "CPRF-S4 MPL" },
  { value: "CPRF-S5 MPL", label: "CPRF-S5 MPL" },
  { value: "CPRF-S6 MPL", label: "CPRF-S6 MPL" },
  { value: "CPRF-S7 MPL", label: "CPRF-S7 MPL" },
  { value: "CPRF-S8 MPL", label: "CPRF-S8 MPL" },
];

export const MACHINE_WIDTH_OPTIONS = [
  { value: "18", label: "18" },
  { value: "24", label: "24" },
  { value: "30", label: "30" },
  { value: "36", label: "36" },
  { value: "42", label: "42" },
  { value: "48", label: "48" },
  { value: "54", label: "54" },
  { value: "60", label: "60" },
];

export const STRAIGHTENER_ROLLS_OPTIONS = [
  { value: "5", label: "5 Rolls" },
  { value: "7", label: "7 Rolls" },
];