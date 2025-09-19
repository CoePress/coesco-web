import React from "react";
import { Card, Input, Select, Text, Textarea } from "@/components";
import { RFQSectionProps } from "./types";
import { FEED_DIRECTION_OPTIONS, YES_NO_OPTIONS } from "@/utils/performance-sheet";

export const SpaceMountingSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Space & Mounting
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <Input
                        label="Equipment Space Length (in)"
                        name="rfq.equipmentSpaceLength"
                        value={localData.rfq?.equipmentSpaceLength?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.equipmentSpaceLength")}
                    />
                </div>
                <div>
                    <Input
                        label="Equipment Space Width (in)"
                        name="rfq.equipmentSpaceWidth"
                        value={localData.rfq?.equipmentSpaceWidth?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.equipmentSpaceWidth")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <Select
                        label="Feeder Mounted to Press"
                        name="rfq.mount.feederMountedToPress"
                        value={localData.rfq?.mount?.feederMountedToPress || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                    />
                </div>
                <div>
                    <Select
                        label="Adequate Support"
                        name="rfq.mount.adequateSupport"
                        value={localData.rfq?.mount?.adequateSupport || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                    />
                </div>
                <div>
                    <Select
                        label="Custom Mounting"
                        name="rfq.mount.customMounting"
                        value={localData.rfq?.mount?.customMounting || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <Input
                        label="Passline Height (in)"
                        name="common.equipment.feed.passline"
                        value={localData.common?.equipment?.feed?.passline || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                    />
                </div>
                <div>
                    <Select
                        label="Loop Pit"
                        name="rfq.loopPit"
                        value={localData.common?.equipment?.feed?.loopPit || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                    />
                </div>
                <div>
                    <Select
                        label="Feed Direction"
                        name="common.equipment.feed.direction"
                        value={localData.common?.equipment?.feed?.direction || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={FEED_DIRECTION_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("common.equipment.feed.direction")}
                    />
                </div>
                <div>
                    <Input
                        label="Walls/columns obstructing equipment's location?"
                        name="rfq.obstructions"
                        value={localData.rfq?.obstructions || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.obstructions")}
                    />
                </div>
            </div>
        </Card>
    );
};
