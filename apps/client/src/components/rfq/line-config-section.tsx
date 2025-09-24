import React, { useMemo } from "react";
import { Card, Input, Select, Text } from "@/components";
import { RFQSectionProps } from "./types";
import {
    PRESS_APPLICATION_OPTIONS,
    RFQ_TYPE_OF_LINE_OPTIONS,
    STANDALONE_TYPE_OF_LINE_OPTIONS,
    YES_NO_OPTIONS
} from "@/utils/performance-sheet";

export const LineConfigSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError: _getFieldError,
    isEditing
}) => {
    // Get current values
    const lineApplication = localData.feed?.feed?.application || "";
    const lineType = localData.common?.equipment?.feed?.lineType || "";

    // Determine line type options based on line application
    const lineTypeOptions = useMemo(() => {
        if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
            return RFQ_TYPE_OF_LINE_OPTIONS;
        } else if (lineApplication === "standalone") {
            return STANDALONE_TYPE_OF_LINE_OPTIONS;
        }
        return RFQ_TYPE_OF_LINE_OPTIONS; // Default fallback
    }, [lineApplication]);

    // Determine pull through options based on line application and line type
    const pullThroughOptions = useMemo(() => {
        if (lineApplication === "pressFeed" || lineApplication === "cutToLength") {
            // For RFQ types: Conventional = No only, Compact = Yes or No
            if (lineType === "Conventional") {
                return [{ value: "No", label: "No" }];
            } else if (lineType === "Compact") {
                return YES_NO_OPTIONS;
            }
        } else if (lineApplication === "standalone") {
            // For standalone types: Feed, Other, Feed-Shear = Yes or No, others = No only
            if (lineType === "Feed" || lineType === "Other" || lineType === "Feed-Shear") {
                return YES_NO_OPTIONS;
            } else {
                return [{ value: "No", label: "No" }];
            }
        }
        return YES_NO_OPTIONS; // Default fallback
    }, [lineApplication, lineType]);

    // Helper function to get pull through options for a given line application and type
    const getPullThroughOptionsForLineType = (app: string, type: string) => {
        if (app === "pressFeed" || app === "cutToLength") {
            if (type === "Conventional") {
                return [{ value: "No", label: "No" }];
            } else if (type === "Compact") {
                return YES_NO_OPTIONS;
            }
        } else if (app === "standalone") {
            if (type === "Feed" || type === "Other" || type === "Feed-Shear") {
                return YES_NO_OPTIONS;
            } else {
                return [{ value: "No", label: "No" }];
            }
        }
        return YES_NO_OPTIONS;
    };

    // Handle field changes with validation for dependent fields
    const handleLocalFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        
        // If line application changes, reset line type and pull through
        if (name === "feed.feed.application") {
            handleFieldChange(e);
            // Reset dependent fields
            handleFieldChange({
                target: {
                    name: "common.equipment.feed.lineType",
                    value: ""
                }
            } as React.ChangeEvent<HTMLSelectElement>);
            handleFieldChange({
                target: {
                    name: "feed.feed.pullThru.isPullThru",
                    value: ""
                }
            } as React.ChangeEvent<HTMLSelectElement>);
        }
        // If line type changes, potentially reset pull through
        else if (name === "common.equipment.feed.lineType") {
            handleFieldChange(e);
            // Check if current pull through value is still valid
            const newPullThroughOptions = getPullThroughOptionsForLineType(lineApplication, value);
            const currentPullThrough = localData.feed?.feed?.pullThru?.isPullThru || "";
            const isCurrentValueValid = newPullThroughOptions.some(option => option.value === currentPullThrough);
            
            if (!isCurrentValueValid) {
                handleFieldChange({
                    target: {
                        name: "feed.feed.pullThru.isPullThru",
                        value: newPullThroughOptions.length === 1 ? newPullThroughOptions[0].value : ""
                    }
                } as React.ChangeEvent<HTMLSelectElement>);
            }
        }
        else {
            handleFieldChange(e);
        }
    };

    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Line Configuration
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <Select
                        label="Line Application"
                        name="feed.feed.application"
                        value={lineApplication}
                        onChange={handleLocalFieldChange}
                        disabled={!isEditing}
                        options={PRESS_APPLICATION_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("feed.feed.application")}
                    />
                </div>
                <div>
                    <Select
                        label="Type of Line"
                        name="common.equipment.feed.lineType"
                        value={lineType}
                        onChange={handleLocalFieldChange}
                        disabled={!isEditing}
                        options={lineTypeOptions}
                        customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.lineType")}
                    />
                </div>
                <div>
                    <Select
                        label="Pull Through"
                        name="feed.feed.pullThru.isPullThru"
                        value={localData.feed?.feed?.pullThru?.isPullThru || ""}
                        onChange={handleLocalFieldChange}
                        disabled={!isEditing}
                        options={pullThroughOptions}
                        customBackgroundColor={getFieldBackgroundColor("feed.feed.pullThru.isPullThru")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Input
                        label="Brand of Feed"
                        name="rfq.brandOfFeed"
                        value={localData.rfq?.brandOfFeed || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                    />
                </div>
                <div>
                    <Select
                        label="Running Cosmetic Material"
                        name="rfq.runningCosmeticMaterial"
                        value={localData.rfq?.runningCosmeticMaterial || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.runningCosmeticMaterial")}
                    />
                </div>
            </div>
        </Card>
    );
};
