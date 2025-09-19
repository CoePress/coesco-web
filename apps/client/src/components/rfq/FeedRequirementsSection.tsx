import React from "react";
import { Card, Input, Text } from "@/components";
import { RFQSectionProps } from "./types";

export const FeedRequirementsSection: React.FC<RFQSectionProps> = ({
    localData,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Feed Requirements
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                    <Input
                        label="Max Feed Length"
                        name="common.feedRates.max.length"
                        value={localData.common?.feedRates?.max?.length?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.max.length")}
                    />
                </div>
                <div>
                    <Input
                        label="Max SPM"
                        name="common.feedRates.max.spm"
                        value={localData.common?.feedRates?.max?.spm?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.max.spm")}
                    />
                </div>
                <div>
                    <Input
                        label="Max FPM"
                        name="common.feedRates.max.fpm"
                        value={localData.common?.feedRates?.max?.fpm?.toString() || ""}
                        disabled={true}
                        className="bg-muted"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div>
                    <Input
                        label="Min SPM"
                        name="common.feedRates.min.spm"
                        value={localData.common?.feedRates?.min?.spm?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.min.spm")}
                    />
                </div>
                <div>
                    <Input
                        label="Min Feed Length"
                        name="common.feedRates.min.length"
                        value={localData.common?.feedRates?.min?.length?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.min.length")}
                    />
                </div>
                <div>
                    <Input
                        label="Min FPM"
                        name="common.feedRates.min.fpm"
                        value={localData.common?.feedRates?.min?.fpm?.toString() || ""}
                        disabled={true}
                        className="bg-muted"
                    />
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                <div>
                    <Input
                        label="Average Feed Length"
                        name="common.feedRates.average.length"
                        value={localData.common?.feedRates?.average?.length?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.average.length")}
                    />
                </div>
                <div>
                    <Input
                        label="Average SPM"
                        name="common.feedRates.average.spm"
                        value={localData.common?.feedRates?.average?.spm?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.feedRates.average.spm")}
                    />
                </div>
                <div>
                    <Input
                        label="Average FPM"
                        name="common.feedRates.average.fpm"
                        value={localData.common?.feedRates?.average?.fpm?.toString() || ""}
                        disabled={true}
                        className="bg-muted"
                    />
                </div>
                <div>
                    <Input
                        label="Voltage Required (VAC)"
                        name="rfq.voltageRequired"
                        value={localData.rfq?.voltageRequired?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.voltageRequired")}
                    />
                </div>
            </div>
        </Card>
    );
};
