import React from "react";
import { Card, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";
import { RFQSectionProps } from "./types";

export const DiesInfoSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Dies Information
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                    <Checkbox
                        label="Transfer Dies"
                        name="rfq.dies.transferDies"
                        checked={localData.rfq?.dies?.transferDies || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dies.transferDies")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Progressive Dies"
                        name="rfq.dies.progressiveDies"
                        checked={localData.rfq?.dies?.progressiveDies || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dies.progressiveDies")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Blanking Dies"
                        name="rfq.dies.blankingDies"
                        checked={localData.rfq?.dies?.blankingDies || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dies.blankingDies")}
                    />
                </div>
            </div>
        </Card>
    );
};
