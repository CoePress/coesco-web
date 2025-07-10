// Centralized select options for reuse across the app

export const FEED_DIRECTION_OPTIONS = [
  { value: "rightToLeft", label: "Right to Left" },
  { value: "leftToRight", label: "Left to Right" },
];

export const CONTROLS_LEVEL_OPTIONS = [
  { value: "miniDriveSystem", label: "Mini-Drive System" },
  { value: "relayMachine", label: "Relay Machine" },
  { value: "syncMaster", label: "SyncMaster" },
  { value: "ipIndexerBasic", label: "IP Indexer Basic" },
  { value: "allenBradleyBasic", label: "Allen Bradley Basic" },
  { value: "syncMasterPlus", label: "SyncMaster Plus" },
  { value: "ipIndexerPlus", label: "IP Indexer Plus" },
  { value: "allenBradleyPlus", label: "Allen Bradley Plus" },
  { value: "fullyAutoamtic", label: "Fully Automatic" },
];

export const TYPE_OF_LINE_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "compactCTL", label: "Compact CTL" },
  { value: "conventional", label: "Conventional" },
  { value: "conventionalCTL", label: "Conventional CTL" },
  { value: "pullThrough", label: "Pull Through" },
  { value: "pullThroughCompact", label: "Pull Through Compact" },
  { value: "pullThroughCTL", label: "Pull Through CTL" },
  { value: "feed", label: "Feed" },
  { value: "feedPullThough", label: "Feed-Pull Through" },
  { value: "feedPullThroughShear", label: "Feed-Pull Through-Shear" },
  { value: "feedShear", label: "Feed-Shear" },
  { value: "straightener", label: "Straightener" },
  { value: "straightenerReelCombo", label: "Straightener-Reel Combination" },
  { value: "reelMotorized", label: "Reel-Motorized" },
  { value: "reelPullOff", label: "Reel-Pull Off" },
  { value: "threadingTable", label: "Threading Table" },
  { value: "other", label: "Other" },
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
  { value: "7RollStrBackbend", label: "7 Roll Str. Backbend" },
  { value: "9RollStrBackbend", label: "9 Roll Str. Backbend" },
  { value: "11RollStrBackbend", label: "11 Roll Str. Backbend" },
];

export const REEL_BACKPLATE_OPTIONS = [
  { value: "standardBackplate", label: "Standard Backplate" },
  { value: "fullODBackplate", label: "Full OD Backplate" },
];

export const REEL_STYLE_OPTIONS = [
  { value: "singleEnded", label: "Single Ended" },
  { value: "doubleEnded", label: "Double Ended" },
];

export const MATERIAL_TYPE_OPTIONS = [
  { value: "aluminum", label: "Aluminum" },
  { value: "galvanized", label: "Galvanized" },
  { value: "hsSteel", label: "HS Steel" },
  { value: "hotRolledSteel", label: "Hot Rolled Steel" },
  { value: "dualPhase", label: "Dual Phase" },
  { value: "coldRolledSteel", label: "Cold Rolled Steel" },
  { value: "sainlessSteel", label: "Stainless Steel" },
  { value: "titanium", label: "Titanium" },
  { value: "brass", label: "Brass" },
  { value: "berylCopper", label: "Beryl Copper" },
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
];