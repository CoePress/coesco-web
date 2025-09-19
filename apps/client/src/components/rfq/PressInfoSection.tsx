import React from "react";
import { Card, Input, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";
import { RFQSectionProps } from "./types";

export const PressInfoSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Press Information
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div>
                    <Checkbox
                        label="Gap Frame Press"
                        name="rfq.press.gapFramePress"
                        checked={localData.rfq?.press?.gapFramePress || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.gapFramePress")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Hydraulic Press"
                        name="rfq.press.hydraulicPress"
                        checked={localData.rfq?.press?.hydraulicPress || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.hydraulicPress")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="OBI"
                        name="rfq.press.obi"
                        checked={localData.rfq?.press?.obi || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.obi")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Servo Press"
                        name="rfq.press.servoPress"
                        checked={localData.rfq?.press?.servoPress || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.servoPress")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Shear Die Application"
                        name="rfq.press.shearDieApplication"
                        checked={localData.rfq?.press?.shearDieApplication || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.shearDieApplication")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Straight Side Press"
                        name="rfq.press.straightSidePress"
                        checked={localData.rfq?.press?.straightSidePress || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.straightSidePress")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Other"
                        name="rfq.press.other"
                        checked={localData.rfq?.press?.other || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.other")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <Input
                        label="Tonnage of Press"
                        name="rfq.press.tonnageOfPress"
                        value={localData.rfq?.press?.tonnageOfPress || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.tonnageOfPress")}
                    />
                </div>
                <div>
                    <Input
                        label="Stroke Length (in)"
                        name="rfq.press.strokeLength"
                        value={localData.rfq?.press?.strokeLength || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.strokeLength")}
                    />
                </div>
                <div>
                    <Input
                        label="Max SPM"
                        name="rfq.press.maxSPM"
                        value={localData.rfq?.press?.maxSPM || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.maxSPM")}
                    />
                </div>
                <div>
                    <Input
                        label="Bed Width (in)"
                        name="rfq.press.bedWidth"
                        value={localData.rfq?.press?.bedWidth || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.bedWidth")}
                    />
                </div>
                <div>
                    <Input
                        label="Bed Length (in)"
                        name="rfq.press.bedLength"
                        value={localData.rfq?.press?.bedLength || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.bedLength")}
                    />
                </div>
                <div>
                    <Input
                        label="Window Size (in)"
                        name="rfq.press.windowSize"
                        value={localData.rfq?.press?.windowSize || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.windowSize")}
                    />
                </div>
                <div>
                    <Input
                        label="Cycle Time (sec)"
                        name="rfq.press.cycleTime"
                        value={localData.rfq?.press?.cycleTime || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.press.cycleTime")}
                    />
                </div>
            </div>
        </Card>
    );
};
