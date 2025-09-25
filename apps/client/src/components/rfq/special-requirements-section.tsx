import React from "react";
import { Card, Select, Text, Textarea } from "@/components";
import { RFQSectionProps } from "./types";
import { YES_NO_OPTIONS } from "@/utils/performance-sheet";

export const SpecialRequirementsSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Special Requirements
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <Select
                        label="Feeder Mounted to Press"
                        name="rfq.mount.feederMountedToPress"
                        value={localData.rfq?.mount?.feederMountedToPress || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        placeholder="Select..."
                        customBackgroundColor={getFieldBackgroundColor("rfq.mount.feederMountedToPress")}
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
                        placeholder="Select..."
                        customBackgroundColor={getFieldBackgroundColor("rfq.mount.adequateSupport")}
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
                        placeholder="Select..."
                        customBackgroundColor={getFieldBackgroundColor("rfq.mount.customMounting")}
                    />
                </div>
                <div>
                    <Select
                        label="Require Guarding"
                        name="rfq.requireGuarding"
                        value={localData.rfq?.requireGuarding || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        placeholder="Select..."
                        customBackgroundColor={getFieldBackgroundColor("rfq.requireGuarding")}
                    />
                </div>
            </div>

            <div>
                <Textarea
                    label="Special Considerations"
                    name="rfq.specialConsiderations"
                    value={localData.rfq?.specialConsiderations || ""}
                    onChange={handleFieldChange}
                    rows={4}
                    disabled={!isEditing}
                    placeholder="Any additional requirements or considerations..."
                />
            </div>
        </Card>
    );
};
