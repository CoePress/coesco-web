export interface TabVisibilityConfig {
  lineApplication?: string;
  lineType?: string;
  pullThrough?: string;
  controlsLevel?: string;
  typeOfLine?: string;
  feedControls?: string;
  selectRoll?: string;
}

export interface VisibleTab {
  label: string;
  value: string;
  dynamicLabel?: string;
}

export function getVisibleTabs(data: any): VisibleTab[] {
  const config = extractConfiguration(data);

  const baseVisibleTabs: VisibleTab[] = [
    { label: "RFQ", value: "rfq" },
    { label: "Material Specs", value: "material-specs" }
  ];

  const additionalTabs = determineAdditionalTabs(config);

  const summaryTab: VisibleTab[] = [
    { label: "Equipment Summary", value: "summary-report" }
  ];

  return [...baseVisibleTabs, ...additionalTabs, ...summaryTab];
}

function extractConfiguration(data: any): TabVisibilityConfig {
  const rawApplication = data?.feed?.feed?.application;
  const normalizedApplication = rawApplication
    ? rawApplication.toLowerCase().replace(/\s+/g, '')
    : undefined;

  return {
    lineApplication: normalizedApplication === 'pressfeed' ? 'pressFeed' :
      normalizedApplication === 'cuttolength' ? 'cutToLength' :
        normalizedApplication === 'standalone' ? 'standalone' : rawApplication,
    lineType: data?.common?.equipment?.feed?.lineType,
    pullThrough: data?.feed?.feed?.pullThru?.isPullThru,
    controlsLevel: data?.common?.equipment?.feed?.controlsLevel,
    typeOfLine: data?.common?.equipment?.feed?.typeOfLine,
    feedControls: data?.materialSpecs?.feed?.controls,
    selectRoll: data?.materialSpecs?.straightener?.rolls?.typeOfRoll ||
      data?.rollStrBackbend?.straightener?.rolls?.typeOfRoll ||
      (data?.materialSpecs?.straightener as any)?.selectRoll
  };
}

function determineAdditionalTabs(config: TabVisibilityConfig): VisibleTab[] {
  const tabs: VisibleTab[] = [];

  if (shouldShowTDDBHD(config)) {
    tabs.push({ label: "TDDBHD", value: "tddbhd" });
  }

  if (shouldShowStrUtility(config)) {
    tabs.push({ label: "Str Utility", value: "str-utility" });
  }

  if (shouldShowRollStrBackbend(config)) {
    const rollLabel = getRollStrBackbendLabel(config.selectRoll);
    tabs.push({
      label: "Roll Str Backbend",
      value: "roll-str-backbend",
      dynamicLabel: rollLabel
    });
  }

  if (shouldShowReelDrive(config)) {
    tabs.push({ label: "Reel Drive", value: "reel-drive" });
  }

  if (shouldShowFeed(config)) {
    const feedLabel = getFeedLabel(config);
    tabs.push({
      label: "Feed",
      value: "feed",
      dynamicLabel: feedLabel
    });
  }

  if (shouldShowShear(config)) {
    tabs.push({ label: "Shear", value: "shear" });
  }

  return tabs;
}

function shouldShowTDDBHD(config: TabVisibilityConfig): boolean {
  const { lineApplication, lineType } = config;

  if ((lineApplication === "pressFeed" || lineApplication === "cutToLength")) {
    return true;
  }

  if (lineApplication === "standalone" && lineType === "Threading Table") {
    return true;
  }

  return false;
}

function shouldShowReelDrive(config: TabVisibilityConfig): boolean {
  const { pullThrough, typeOfLine, lineType, lineApplication } = config;

  if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
    return pullThrough === "Yes" ||
      (typeOfLine && typeOfLine.toLowerCase().includes("pull through")) ||
      (lineType === "Compact" && pullThrough === "Yes");
  }

  if (lineApplication === "standalone") {
    return lineType === "Reel-Motorized" ||
      lineType === "Reel-Pull Off" ||
      lineType === "Straightener-Reel Combination";
  }

  return false;
}

function shouldShowStrUtility(config: TabVisibilityConfig): boolean {
  const { lineApplication, lineType, typeOfLine } = config;

  if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
    const isConventional = lineType === "Conventional" ||
      Boolean(typeOfLine && typeOfLine.toLowerCase().includes("conventional"));
    return isConventional;
  }

  if (lineApplication === "standalone") {
    return lineType === "Straightener" || lineType === "Straightener-Reel Combination";
  }

  return false;
}

function shouldShowRollStrBackbend(config: TabVisibilityConfig): boolean {
  const { lineApplication, lineType } = config;

  if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
    // Always show for Press Feed/Cut to Length applications
    return true;
  }

  if (lineApplication === "standalone") {
    return lineType === "Straightener" || lineType === "Straightener-Reel Combination";
  }

  return false;
}

function shouldShowFeed(config: TabVisibilityConfig): boolean {
  const { feedControls, lineApplication, lineType } = config;

  if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
    return true;
  }

  if (lineApplication === "standalone") {
    return lineType === "Feed" || lineType === "Feed-Shear";
  }

  return !!(feedControls && feedControls !== "");
}

function shouldShowShear(config: TabVisibilityConfig): boolean {
  const { lineApplication, typeOfLine, lineType } = config;

  if (lineApplication === "cutToLength") {
    return true;
  }

  if (lineApplication === "standalone" && lineType === "Feed-Shear") {
    return true;
  }

  return (typeOfLine && typeOfLine.includes("CTL")) ||
    (typeOfLine && typeOfLine.includes("Shear")) ||
    false;
}

function getRollStrBackbendLabel(_selectRoll?: string): string {
  return "Roll Str Backbend";
}

function getFeedLabel(_config: TabVisibilityConfig): string {
  return "Feed";
}

export function getAllAvailableTabs(): VisibleTab[] {
  return [
    { label: "RFQ", value: "rfq" },
    { label: "Material Specs", value: "material-specs" },
    { label: "TDDBHD", value: "tddbhd" },
    { label: "Reel Drive", value: "reel-drive" },
    { label: "Str Utility", value: "str-utility" },
    { label: "Roll Straightener", value: "roll-str-backbend" },
    { label: "Feed", value: "feed" },
    { label: "Shear", value: "shear" },
    { label: "Equipment Summary", value: "summary-report" }
  ];
}
