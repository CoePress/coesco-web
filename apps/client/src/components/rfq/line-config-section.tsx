import React from "react";
import { Card, Input, Select, Text } from "@/components";
import { RFQSectionProps } from "./types";
import {
    PRESS_APPLICATION_OPTIONS,
    TYPE_OF_LINE_OPTIONS,
    YES_NO_OPTIONS
} from "@/utils/performance-sheet";

export const LineConfigSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
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
                        value={localData.feed?.feed?.application || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={PRESS_APPLICATION_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("feed.feed.application")}
                    />
                </div>
                <div>
                    <Select
                        label="Type of Line"
                        name="common.equipment.feed.typeOfLine"
                        value={localData.common?.equipment?.feed?.typeOfLine || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={TYPE_OF_LINE_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.typeOfLine")}
                    />
                </div>
                <div>
                    <Select
                        label="Pull Through"
                        name="feed.feed.pullThru.isPullThru"
                        value={localData.feed?.feed?.pullThru?.isPullThru || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
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
