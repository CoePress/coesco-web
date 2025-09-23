import React from "react";
import { Card, Input, Select, Text } from "@/components";
import { RFQSectionProps } from "./types";
import { MATERIAL_TYPE_OPTIONS } from "@/utils/performance-sheet";

export const MaterialSpecsSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Material Specifications
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Input
                        label="Material Thickness (in)"
                        name="common.material.materialThickness"
                        value={localData.common?.material?.materialThickness?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.material.materialThickness")}
                    />
                </div>
                <div>
                    <Input
                        label="Coil Width (in)"
                        name="common.material.coilWidth"
                        value={localData.common?.material?.coilWidth?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.material.coilWidth")}
                    />
                </div>
                <div>
                    <Select
                        label="Material Type"
                        name="common.material.materialType"
                        value={localData.common?.material?.materialType || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={MATERIAL_TYPE_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("common.material.materialType")}
                    />
                </div>
                <div>
                    <Input
                        label="Max Yield Strength (PSI)"
                        name="common.material.maxYieldStrength"
                        value={localData.common?.material?.maxYieldStrength?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.material.maxYieldStrength")}
                    />
                </div>
                <div>
                    <Input
                        label="Max Tensile Strength (PSI)"
                        name="common.material.maxTensileStrength"
                        value={localData.common?.material?.maxTensileStrength?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                    />
                </div>
            </div>
        </Card>
    );
};
