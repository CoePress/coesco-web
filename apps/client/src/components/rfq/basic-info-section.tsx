import React from "react";
import { Card, Input, Select, Text } from "@/components";
import { RFQSectionProps } from "./types";
import { AutoFillFieldIndicator } from "../performance/auto-fill-ui";

export const BasicInfoSection: React.FC<RFQSectionProps> = ({
    localData,
    fieldErrors,
    handleFieldChange,
    getFieldBackgroundColor,
    getFieldError,
    isEditing
}) => {
    return (
        <Card className="mb-4 p-4">
            <Text as="h3" className="mb-4 text-lg font-medium">
                Basic Information
            </Text>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                    <Input
                        label="Reference Number *"
                        name="referenceNumber"
                        value={localData.referenceNumber || ""}
                        onChange={handleFieldChange}
                        error={getFieldError("referenceNumber")}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("referenceNumber")}
                    />
                </div>
                <div>
                    <Input
                        label="Date"
                        type="date"
                        name="rfq.dates.date"
                        value={localData.rfq?.dates?.date || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dates.date")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                    <div className="space-y-1">
                        <Input
                            label="Company Name *"
                            name="common.customer"
                            value={localData.common?.customer || ""}
                            onChange={handleFieldChange}
                            error={fieldErrors["common.customer"]}
                            disabled={!isEditing}
                            customBackgroundColor={getFieldBackgroundColor("common.customer")}
                        />
                        <AutoFillFieldIndicator
                            fieldPath="common.customer"
                            isVisible={isEditing}
                            className="mt-1"
                        />
                    </div>
                </div>
                <div>
                    <Input
                        label="State/Province"
                        name="common.customerInfo.state"
                        value={localData.common?.customerInfo?.state || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.state")}
                    />
                </div>
                <div>
                    <Input
                        label="Street Address"
                        name="common.customerInfo.streetAddress"
                        value={localData.common?.customerInfo?.streetAddress || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.streetAddress")}
                    />
                </div>
                <div>
                    <Input
                        label="ZIP/Postal Code"
                        name="common.customerInfo.zip"
                        type="text"
                        value={localData.common?.customerInfo?.zip || ""}
                        onChange={handleFieldChange}
                        error={fieldErrors["common.customerInfo.zip"]}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.zip")}
                    />
                </div>
                <div>
                    <Input
                        label="City"
                        name="common.customerInfo.city"
                        value={localData.common?.customerInfo?.city || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.city")}
                    />
                </div>
                <div>
                    <Input
                        label="Country"
                        name="common.customerInfo.country"
                        value={localData.common?.customerInfo?.country || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.country")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                <div>
                    <Input
                        label="Contact Name"
                        name="common.customerInfo.contactName"
                        value={localData.common?.customerInfo?.contactName || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.contactName")}
                    />
                </div>
                <div>
                    <Input
                        label="Position"
                        name="common.customerInfo.position"
                        value={localData.common?.customerInfo?.position || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.position")}
                    />
                </div>
                <div>
                    <Input
                        label="Phone"
                        name="common.customerInfo.phoneNumber"
                        value={localData.common?.customerInfo?.phoneNumber || ""}
                        onChange={handleFieldChange}
                        error={fieldErrors["common.customerInfo.phoneNumber"]}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.phoneNumber")}
                    />
                </div>
                <div>
                    <Input
                        label="Email"
                        name="common.customerInfo.email"
                        value={localData.common?.customerInfo?.email || ""}
                        onChange={handleFieldChange}
                        error={fieldErrors["common.customerInfo.email"]}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.email")}
                    />
                </div>
                <div>
                    <Input
                        label="Dealer Name"
                        name="common.customerInfo.dealerName"
                        value={localData.common?.customerInfo?.dealerName || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.dealerName")}
                    />
                </div>
                <div>
                    <Input
                        label="Dealer Salesman"
                        name="common.customerInfo.dealerSalesman"
                        value={localData.common?.customerInfo?.dealerSalesman || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("common.customerInfo.dealerSalesman")}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <Select
                        label="Days per week running"
                        name="common.customerInfo.daysPerWeek"
                        value={localData.common?.customerInfo?.daysPerWeek?.toString() || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        options={[
                            { value: "1", label: "1" },
                            { value: "2", label: "2" },
                            { value: "3", label: "3" },
                            { value: "4", label: "4" },
                            { value: "5", label: "5" },
                            { value: "6", label: "6" },
                            { value: "7", label: "7" }
                        ]}
                    />
                </div>
                <div>
                    <Input
                        label="Shifts per day"
                        name="common.customerInfo.shiftsPerDay"
                        value={localData.common?.customerInfo?.shiftsPerDay?.toString() || ""}
                        onChange={handleFieldChange}
                        type="number"
                        disabled={!isEditing}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
                <div>
                    <Input
                        label="Decision Date"
                        type="date"
                        name="rfq.dates.decisionDate"
                        value={localData.rfq?.dates?.decisionDate || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dates.decisionDate")}
                    />
                </div>
                <div>
                    <Input
                        label="Ideal Delivery Date"
                        type="date"
                        name="rfq.dates.idealDeliveryDate"
                        value={localData.rfq?.dates?.idealDeliveryDate || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                        customBackgroundColor={getFieldBackgroundColor("rfq.dates.idealDeliveryDate")}
                    />
                </div>
                <div>
                    <Input
                        label="Earliest Delivery Date"
                        type="date"
                        name="rfq.dates.earliestDeliveryDate"
                        value={localData.rfq?.dates?.earliestDeliveryDate || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                    />
                </div>
                <div>
                    <Input
                        label="Latest Delivery Date"
                        type="date"
                        name="rfq.dates.latestDeliveryDate"
                        value={localData.rfq?.dates?.latestDeliveryDate || ""}
                        onChange={handleFieldChange}
                        disabled={!isEditing}
                    />
                </div>
            </div>
        </Card>
    );
};
