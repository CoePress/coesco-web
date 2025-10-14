import React, { useMemo } from "react";
import { Card, Input, Select, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";
import { RFQSectionProps } from "./types";
import {
    FEED_DIRECTION_OPTIONS,
    CONTROLS_LEVEL_OPTIONS,
    TYPE_OF_LINE_OPTIONS,
    PASSLINE_OPTIONS,
    ROLL_TYPE_OPTIONS,
    REEL_BACKPLATE_OPTIONS,
    REEL_STYLE_OPTIONS,
} from "@/utils/performance-sheet";
import {
    mapControlsLevelToFeedControls,
} from "@/utils/feed-controls-mapping";

export const EquipmentConfigSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    // Get feed controls mapping based on controls level
    const feedControlsMapping = useMemo(() => {
        const controlsLevel = localData.common?.equipment?.feed?.controlsLevel || "";
        return mapControlsLevelToFeedControls(controlsLevel);
    }, [localData.common?.equipment?.feed?.controlsLevel]);

    // Get feed controls background color based on validation
    const getFeedControlsBackgroundColor = useMemo(() => {
        const currentValue = localData.common?.equipment?.feed?.controls || feedControlsMapping.controls;
        const validOptions = [
            "Sigma 5 Feed",
            "Sigma 5 Feed Plus",
            "Sigma 5 Feed Pull Thru",
            "Allen Bradley",
            "Allen Bradley MPL Feed",
            "Allen Bradley MPL Feed Plus",
            "IP Indexer Feed",
            "IP Indexer Feed Plus"
        ];

        if (!currentValue) {
            return undefined; // No value, no special color
        }

        // Check if current value matches any of the valid options (case insensitive)
        const isValid = validOptions.some(option =>
            option.toLowerCase() === currentValue.toLowerCase().trim()
        );

        return isValid ? 'var(--color-success)' : undefined;
    }, [localData.common?.equipment?.feed?.controls, feedControlsMapping.controls]);

    // Get background color for Type of Roll based on selected value
    const getRollTypeBackgroundColor = useMemo(() => {
        const rollType = localData.materialSpecs?.straightener?.rolls?.typeOfRoll;

        // Handle both string and number values
        const rollTypeStr = typeof rollType === 'number' ? `${rollType} Roll Str Backbend` : rollType;

        if (rollTypeStr?.includes('7 Roll')) {
            return 'var(--color-success)'; // Green for 7-roll
        } else if (rollTypeStr?.includes('9 Roll')) {
            return 'var(--color-warning)'; // Yellow for 9-roll
        } else if (rollTypeStr?.includes('11 Roll')) {
            return 'var(--color-info)'; // Cyan for 11-roll
        }

        return undefined; // No special color for other values
    }, [localData.materialSpecs?.straightener?.rolls?.typeOfRoll]);

    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Equipment Configuration
            </Text>

            {/* Feed Configuration */}
            <div className="mb-6">
                <Text as="h4" className="mb-3 text-md font-medium text-blue-600">
                    Feed Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <Select
                            label="Feed Direction"
                            name="common.equipment.feed.direction"
                            value={localData.common?.equipment?.feed?.direction || ""}
                            onChange={handleFieldChange}
                            options={FEED_DIRECTION_OPTIONS}
                            placeholder="Select feed direction..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.direction")}
                        />
                    </div>
                    <div>
                        <Select
                            label="Controls Level"
                            name="common.equipment.feed.controlsLevel"
                            value={localData.common?.equipment?.feed?.controlsLevel || ""}
                            onChange={handleFieldChange}
                            options={CONTROLS_LEVEL_OPTIONS}
                            placeholder="Select controls level..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.controlsLevel")}
                        />
                    </div>
                    <div>
                        <Select
                            label="Type of Line"
                            name="common.equipment.feed.typeOfLine"
                            value={localData.common?.equipment?.feed?.typeOfLine || ""}
                            onChange={handleFieldChange}
                            options={TYPE_OF_LINE_OPTIONS}
                            placeholder="Select type of line..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.typeOfLine")}
                        />
                    </div>
                    <div>
                        <Input
                            label="Feed Controls"
                            name="common.equipment.feed.controls"
                            value={localData.common?.equipment?.feed?.controls || feedControlsMapping.controls || "Sigma 5 Feed"}
                            onChange={handleFieldChange}
                            disabled={true}
                            customBackgroundColor={getFeedControlsBackgroundColor}
                        />
                    </div>
                    <div>
                        <Select
                            label="Passline"
                            name="common.equipment.feed.passline"
                            value={localData.common?.equipment?.feed?.passline || ""}
                            onChange={handleFieldChange}
                            options={PASSLINE_OPTIONS}
                            placeholder="Select passline..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.passline")}
                        />
                    </div>
                </div>

                {/* Feed Options Checkboxes */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <Checkbox
                            label="Light Gauge Non-Marking"
                            name="common.equipment.feed.lightGuageNonMarking"
                            checked={localData.common?.equipment?.feed?.lightGuageNonMarking === "true"}
                            onChange={handleFieldChange}
                            disabled={!isEditing}
                        />
                    </div>
                    <div>
                        <Checkbox
                            label="Non-Marking"
                            name="common.equipment.feed.nonMarking"
                            checked={localData.common?.equipment?.feed?.nonMarking === "true"}
                            onChange={handleFieldChange}
                            disabled={!isEditing}
                        />
                    </div>
                </div>
            </div>

            {/* Straightener Configuration */}
            <div className="mb-6">
                <Text as="h4" className="mb-3 text-md font-medium text-green-600">
                    Straightener Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <Select
                            label="Type of Roll"
                            name="materialSpecs.straightener.rolls.typeOfRoll"
                            value={localData.materialSpecs?.straightener?.rolls?.typeOfRoll || ""}
                            onChange={e => {
                                handleFieldChange(e);
                                const value = e.target.value;
                                let numRolls = 0;
                                if (value.includes("7 Roll")) numRolls = 7;
                                else if (value.includes("9 Roll")) numRolls = 9;
                                else if (value.includes("11 Roll")) numRolls = 11;
                                if (numRolls) {
                                    handleFieldChange({
                                        target: {
                                            name: "common.equipment.straightener.numberOfRolls",
                                            value: numRolls.toString()
                                        }
                                    } as React.ChangeEvent<HTMLInputElement>);
                                }
                            }}
                            options={ROLL_TYPE_OPTIONS}
                            placeholder="Select type of roll..."
                            disabled={!isEditing}
                            customBackgroundColor={getRollTypeBackgroundColor}
                        />
                    </div>
                </div>
            </div>

            {/* Reel Configuration */}
            <div>
                <Text as="h4" className="mb-3 text-md font-medium text-purple-600">
                    Reel Configuration
                </Text>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                        <Select
                            label="Reel Backplate Type"
                            name="materialSpecs.reel.backplate.type"
                            value={localData.materialSpecs?.reel?.backplate?.type || ""}
                            onChange={handleFieldChange}
                            options={REEL_BACKPLATE_OPTIONS}
                            placeholder="Select backplate type..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("materialSpecs.reel.backplate.type")}
                        />
                    </div>
                    <div>
                        <Select
                            label="Reel Style"
                            name="materialSpecs.reel.style"
                            value={localData.materialSpecs?.reel?.style || ""}
                            onChange={handleFieldChange}
                            options={REEL_STYLE_OPTIONS}
                            placeholder="Select reel style..."
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("materialSpecs.reel.style")}
                        />
                    </div>
                </div>
            </div>
        </Card>
    );
};