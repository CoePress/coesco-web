import React from "react";
import { Card, Input, Select, Text } from "@/components";
import Checkbox from "@/components/_old/checkbox";
import { RFQSectionProps } from "./types";
import { YES_NO_OPTIONS, LOADING_OPTIONS } from "@/utils/performance-sheet";

export const CoilSpecsSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Coil Specifications
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                    <Input
                        label="Max Coil Width (in)"
                        name="common.coil.maxCoilWidth"
                        value={localData.common?.coil?.maxCoilWidth?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.coil.maxCoilWidth")}
                    />
                </div>
                <div>
                    <Input
                        label="Min Coil Width (in)"
                        name="common.coil.minCoilWidth"
                        value={localData.common?.coil?.minCoilWidth?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.coil.minCoilWidth")}
                    />
                </div>
                <div>
                    <Input
                        label="Max Coil OD (in)"
                        name="common.coil.maxCoilOD"
                        value={localData.common?.coil?.maxCoilOD?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.coil.maxCoilOD")}
                    />
                </div>
                <div>
                    <Input
                        label="Coil ID (in)"
                        name="common.coil.coilID"
                        value={localData.common?.coil?.coilID?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.coil.coilID")}
                    />
                </div>
                <div>
                    <Input
                        label="Max Coil Weight (lbs)"
                        name="common.coil.maxCoilWeight"
                        value={localData.common?.coil?.maxCoilWeight?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.coil.maxCoilWeight")}
                    />
                </div>
                <div>
                    <Input
                        label="Max Coil Handling Cap (lbs)"
                        name="common.coil.maxCoilHandlingCap"
                        value={localData.common?.coil?.maxCoilHandlingCap?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
                <div>
                    <Checkbox
                        label="Slit Edge"
                        name="rfq.coil.slitEdge"
                        checked={localData.rfq?.coil?.slitEdge || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.slitEdge")}
                    />
                </div>
                <div>
                    <Checkbox
                        label="Mill Edge"
                        name="rfq.coil.millEdge"
                        checked={localData.rfq?.coil?.millEdge || false}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.millEdge")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Select
                        label="Require Coil Car"
                        name="rfq.coil.requireCoilCar"
                        value={localData.rfq?.coil?.requireCoilCar || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.requireCoilCar")}
                    />
                </div>
                <div>
                    <Select
                        label="Running Off Backplate"
                        name="rfq.coil.runningOffBackplate"
                        value={localData.rfq?.coil?.runningOffBackplate || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.runningOffBackplate")}
                    />
                </div>
                <div>
                    <Select
                        label="Require Rewinding"
                        name="rfq.coil.requireRewinding"
                        value={localData.rfq?.coil?.requireRewinding || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.requireRewinding")}
                    />
                </div>
                <div>
                    <Select
                        label="Change Time Concern"
                        name="rfq.coil.changeTimeConcern"
                        value={localData.rfq?.coil?.changeTimeConcern || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={YES_NO_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.changeTimeConcern")}
                    />
                </div>
                <div>
                    <Input
                        label="Time Change Goal (min)"
                        name="rfq.coil.timeChangeGoal"
                        value={localData.rfq?.coil?.timeChangeGoal || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                    />
                </div>
                <div>
                    <Select
                        label="Loading"
                        name="rfq.coil.loading"
                        value={localData.rfq?.coil?.loading || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={LOADING_OPTIONS}
                        customBackgroundColor={getFieldBackgroundColor("rfq.coil.loading")}
                    />
                </div>
            </div>
        </Card>
    );
};
