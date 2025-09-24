/**
 * Tab Visibility Logic for Performance Sheets
 * Determines which tabs should be visible based on configuration options
 */

import { PerformanceData } from "@/contexts/performance.context";

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
    dynamicLabel?: string; // For tabs with dynamic labels
}

/**
 * Determines which tabs should be visible based on configuration
 */
export function getVisibleTabs(data: PerformanceData): VisibleTab[] {
    // Extract configuration values from the data
    const config: TabVisibilityConfig = {
        lineApplication: data?.feed?.feed?.application,
        lineType: data?.common?.equipment?.feed?.lineType,
        pullThrough: data?.feed?.feed?.pullThru?.isPullThru,
        controlsLevel: data?.common?.equipment?.feed?.controlsLevel,
        typeOfLine: data?.common?.equipment?.feed?.typeOfLine,
        feedControls: data?.materialSpecs?.feed?.controls,
        selectRoll: data?.rollStrBackbend?.straightener?.rolls?.typeOfRoll || (data?.materialSpecs?.straightener as any)?.selectRoll
    };

    // Always visible tabs
    const visibleTabs: VisibleTab[] = [
        { label: "RFQ", value: "rfq" },
        { label: "Material Specs", value: "material-specs" },
        { label: "Equipment Summary", value: "summary-report" }
    ];

    // Determine additional tabs based on configuration
    const additionalTabs = determineAdditionalTabs(config);
    
    return [...visibleTabs, ...additionalTabs];
}

/**
 * Determines additional tabs based on configuration logic
 */
function determineAdditionalTabs(config: TabVisibilityConfig): VisibleTab[] {
    const tabs: VisibleTab[] = [];

    // TDDBHD Logic - appears for press feed and cut to length with certain conditions
    if (shouldShowTDDBHD(config)) {
        tabs.push({ label: "TDDBHD", value: "tddbhd" });
    }

    // Str Utility Logic - appears for configurations that need straightener
    if (shouldShowStrUtility(config)) {
        tabs.push({ label: "Str Utility", value: "str-utility" });
    }

    // Roll Str Backbend Logic - appears when specific roll types are selected
    if (shouldShowRollStrBackbend(config)) {
        const rollLabel = getRollStrBackbendLabel(config.selectRoll);
        tabs.push({ 
            label: "Roll Straightener", 
            value: "roll-str-backbend",
            dynamicLabel: rollLabel
        });
    }

    // Reel Drive Logic - appears for pull through configurations
    if (shouldShowReelDrive(config)) {
        tabs.push({ label: "Reel Drive", value: "reel-drive" });
    }

    // Feed Logic - appears based on feed controls selection
    if (shouldShowFeed(config)) {
        const feedLabel = getFeedLabel(config);
        tabs.push({ 
            label: "Feed", 
            value: "feed",
            dynamicLabel: feedLabel
        });
    }

    // Shear Logic - appears for cut to length configurations
    if (shouldShowShear(config)) {
        tabs.push({ label: "Shear", value: "shear" });
    }

    return tabs;
}

/**
 * Determines if TDDBHD tab should be visible
 */
function shouldShowTDDBHD(config: TabVisibilityConfig): boolean {
    const { lineApplication, controlsLevel } = config;
    
    // Show for press feed and cut to length with SyncMaster or SyncMaster Plus
    if ((lineApplication === "pressFeed" || lineApplication === "cutToLength")) {
        return controlsLevel === "SyncMaster" || controlsLevel === "SyncMaster Plus";
    }
    
    return false;
}

/**
 * Determines if Reel Drive tab should be visible
 */
function shouldShowReelDrive(config: TabVisibilityConfig): boolean {
    const { pullThrough, typeOfLine, lineType } = config;
    
    // Show for pull through configurations
    // Example 4: line type = compact, pull through = yes, type of line = pull through compact
    return pullThrough === "Yes" || 
           (typeOfLine && typeOfLine.toLowerCase().includes("pull through")) ||
           (lineType === "Compact" && pullThrough === "Yes") ||
           false;
}

/**
 * Determines if Str Utility tab should be visible
 */
function shouldShowStrUtility(config: TabVisibilityConfig): boolean {
    const { lineApplication, lineType, controlsLevel, typeOfLine } = config;
    
    // Show for press feed and cut to length with conventional configurations and SyncMaster controls
    // Examples 1 & 3: conventional configurations with SyncMaster/SyncMaster Plus
    if ((lineApplication === "pressFeed" || lineApplication === "cutToLength")) {
        const isConventional = lineType === "Conventional" || 
                              Boolean(typeOfLine && typeOfLine.toLowerCase().includes("conventional"));
        const hasSyncMaster = controlsLevel === "SyncMaster" || controlsLevel === "SyncMaster Plus";
        return Boolean(isConventional && hasSyncMaster);
    }
    
    return false;
}

/**
 * Determines if Roll Straightener tab should be visible
 */
function shouldShowRollStrBackbend(config: TabVisibilityConfig): boolean {
    const { selectRoll, lineApplication, lineType } = config;
    
    // Show when a roll type is selected and it's not a standalone feed-only configuration
    if (selectRoll && selectRoll.includes("Roll Str")) {
        // Don't show for standalone feed only configurations (Example 2)
        if (lineApplication === "standalone" && lineType === "Feed") {
            return false;
        }
        return true;
    }
    
    return false;
}

/**
 * Determines if Feed tab should be visible
 */
function shouldShowFeed(config: TabVisibilityConfig): boolean {
    const { feedControls, lineApplication, lineType } = config;
    
    // Show when feed controls are specified
    // Also show for standalone feed configurations and other feed-related configurations
    return (!!feedControls && feedControls !== "") ||
           (lineApplication === "standalone" && lineType === "Feed") ||
           lineApplication === "pressFeed" ||
           lineApplication === "cutToLength";
}

/**
 * Determines if Shear tab should be visible
 */
function shouldShowShear(config: TabVisibilityConfig): boolean {
    const { lineApplication, typeOfLine } = config;
    
    // Show for cut to length configurations or when shear is mentioned in type of line
    return lineApplication === "cutToLength" || 
           (typeOfLine && typeOfLine.includes("CTL")) ||
           (typeOfLine && typeOfLine.includes("Shear")) ||
           false;
}

/**
 * Gets the dynamic label for Roll Straightener tab
 */
function getRollStrBackbendLabel(selectRoll?: string): string {
    if (!selectRoll) return "Roll Straightener";
    
    // Return just the roll type as the tab label
    return selectRoll;
}

/**
 * Gets the dynamic label for Feed tab
 */
function getFeedLabel(config: TabVisibilityConfig): string {
    const { feedControls, pullThrough } = config;
    
    if (!feedControls) return "Feed";
    
    // Add pull through designation if applicable (Example 4)
    if (pullThrough === "Yes" && feedControls.toLowerCase().includes("sigma")) {
        return `Feed (${feedControls} with pull through)`;
    }
    
    // Standard feed control labels (Examples 1, 2, 3)
    return `Feed (${feedControls})`;
}

/**
 * Gets the full list of available tabs for reference
 */
export function getAllAvailableTabs(): VisibleTab[] {
    return [
        { label: "RFQ", value: "rfq" },
        { label: "Material Specs", value: "material-specs" },
        { label: "Equipment Summary", value: "summary-report" },
        { label: "TDDBHD", value: "tddbhd" },
        { label: "Reel Drive", value: "reel-drive" },
        { label: "Str Utility", value: "str-utility" },
        { label: "Roll Straightener", value: "roll-str-backbend" },
        { label: "Feed", value: "feed" },
        { label: "Shear", value: "shear" }
    ];
}
