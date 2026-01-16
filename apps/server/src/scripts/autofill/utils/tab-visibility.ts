/**
 * Tab Visibility Logic for Performance Sheets
 * Determines which tabs should be visible based on configuration options
 * (Migrated from client to server)
 */

import { PerformanceData } from '../types/performance-data.types';

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
    // Normalize application values to handle both "Press Feed" and "pressFeed" formats
    const rawApplication = data?.feed?.feed?.application;
    const normalizedApplication = rawApplication
        ? rawApplication.toLowerCase().replace(/\s+/g, '')
        : undefined;

    const config: TabVisibilityConfig = {
        lineApplication: normalizedApplication === 'pressfeed' ? 'pressFeed' :
            normalizedApplication === 'cuttolength' ? 'cutToLength' :
                normalizedApplication === 'standalone' ? 'standalone' : rawApplication,
        lineType: data?.common?.equipment?.feed?.lineType,
        pullThrough: data?.feed?.feed?.pullThru?.isPullThru,
        controlsLevel: data?.common?.equipment?.feed?.controlsLevel,
        typeOfLine: data?.common?.equipment?.feed?.typeOfLine,
        feedControls: data?.materialSpecs?.feed?.controls,
        selectRoll: data?.materialSpecs?.straightener?.rolls?.typeOfRoll || data?.rollStrBackbend?.straightener?.rolls?.typeOfRoll || (data?.materialSpecs?.straightener as any)?.selectRoll
    };

    // Always visible tabs
    const baseVisibleTabs: VisibleTab[] = [
        { label: "RFQ", value: "rfq" },
        { label: "Material Specs", value: "material-specs" }
    ];

    // Determine additional tabs based on configuration
    const additionalTabs = determineAdditionalTabs(config);

    // Equipment Summary is always last
    const summaryTab: VisibleTab[] = [
        { label: "Equipment Summary", value: "summary-report" }
    ];

    return [...baseVisibleTabs, ...additionalTabs, ...summaryTab];
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
    const { lineApplication, controlsLevel, lineType } = config;

    // For Press Feed and Cut to Length
    if ((lineApplication === "pressFeed" || lineApplication === "cutToLength")) {
        return true;
    }

    // For Standalone - Threading Table
    if (lineApplication === "standalone" && lineType === "Threading Table") {
        return true;
    }

    return false;
}

/**
 * Determines if Reel Drive tab should be visible
 */
function shouldShowReelDrive(config: TabVisibilityConfig): boolean {
    const { pullThrough, typeOfLine, lineType, lineApplication } = config;

    // For Press Feed and Cut to Length - show for pull through configurations
    if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
        return pullThrough === "Yes" ||
            (typeOfLine && typeOfLine.toLowerCase().includes("pull through")) ||
            (lineType === "Compact" && pullThrough === "Yes");
    }

    // For Standalone - show for reel configurations and straightener-reel combination
    if (lineApplication === "standalone") {
        return lineType === "Reel-Motorized" ||
            lineType === "Reel-Pull Off" ||
            lineType === "Straightener-Reel Combination";
    }

    return false;
}

/**
 * Determines if Str Utility tab should be visible
 */
function shouldShowStrUtility(config: TabVisibilityConfig): boolean {
    const { lineApplication, lineType, typeOfLine } = config;

    // For Press Feed and Cut to Length
    if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
        const isConventional = lineType === "Conventional" ||
            Boolean(typeOfLine && typeOfLine.toLowerCase().includes("conventional"));
        // Show STR Utility for all Conventional lines (removed SyncMaster requirement)
        return isConventional;
    }

    // For Standalone - show for straightener configurations
    if (lineApplication === "standalone") {
        return lineType === "Straightener" || lineType === "Straightener-Reel Combination";
    }

    return false;
}

/**
 * Determines if Roll Straightener tab should be visible
 */
function shouldShowRollStrBackbend(config: TabVisibilityConfig): boolean {
    const { selectRoll, lineApplication, lineType } = config;

    // For Press Feed and Cut to Length - always show (don't require roll selection)
    if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
        return true;
    }

    // For Standalone - show for straightener configurations
    if (lineApplication === "standalone") {
        return lineType === "Straightener" || lineType === "Straightener-Reel Combination";
    }

    return false;
}

/**
 * Determines if Feed tab should be visible
 */
function shouldShowFeed(config: TabVisibilityConfig): boolean {
    const { feedControls, lineApplication, lineType } = config;

    // For Press Feed and Cut to Length - always show
    if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
        return true;
    }

    // For Standalone - show for feed configurations
    if (lineApplication === "standalone") {
        return lineType === "Feed" || lineType === "Feed-Shear";
    }

    // Legacy logic for feed controls
    return !!(feedControls && feedControls !== "");
}

/**
 * Determines if Shear tab should be visible
 */
function shouldShowShear(config: TabVisibilityConfig): boolean {
    const { lineApplication, typeOfLine, lineType } = config;

    // For Cut to Length - always show
    if (lineApplication === "cutToLength") {
        return true;
    }

    // For Standalone - show for feed-shear configuration
    if (lineApplication === "standalone" && lineType === "Feed-Shear") {
        return true;
    }

    // Legacy logic for type of line mentions
    return (typeOfLine && typeOfLine.includes("CTL")) ||
        (typeOfLine && typeOfLine.includes("Shear")) ||
        false;
}

/**
 * Gets the dynamic label for Roll Straightener tab
 */
function getRollStrBackbendLabel(selectRoll?: string): string {
    if (!selectRoll) return "Roll Straightener";

    // Always return "Roll Str Backbend" regardless of roll number
    return "Roll Str Backbend";
}

/**
 * Gets the dynamic label for Feed tab
 */
function getFeedLabel(_config: TabVisibilityConfig): string {
    // Always return "Feed" as the tab name should not change
    return "Feed";
}

/**
 * Gets the full list of available tabs for reference
 */
export function getAllAvailableTabs(): VisibleTab[] {
    return [
        { label: "RFQ", value: "rfq" },
        { label: "Equipment Summary", value: "summary-report" },
        { label: "TDDBHD", value: "tddbhd" },
        { label: "Reel Drive", value: "reel-drive" },
        { label: "Str Utility", value: "str-utility" },
        { label: "Roll Straightener", value: "roll-str-backbend" },
        { label: "Feed", value: "feed" },
        { label: "Shear", value: "shear" }
    ];
}
