import React, { useCallback } from "react";
import { useParams } from "react-router-dom";

import {
  usePerformanceDataService,
} from "@/utils/performance-sheet";
import { PerformanceData } from "@/contexts/performance.context";
import { RFQErrorBoundary } from "@/components/error";
import { getRequiredFieldBackgroundColor } from "../../utils/performanceHelpers";

// Import lazy-loaded sections
import {
  BasicInfoSection,
  LineConfigSection,
  CoilSpecsSection,
  MaterialSpecsSection,
  PressInfoSection,
  DiesInfoSection,
  FeedRequirementsSection,
  SpaceMountingSection,
  SpecialRequirementsSection
} from "@/components/lazy";

export interface RFQProps {
  data: PerformanceData;
  isEditing: boolean;
}

const RFQ: React.FC<RFQProps> = ({ data, isEditing }) => {
  const { id: performanceSheetId } = useParams();

  // Use the performance data service
  const dataService = usePerformanceDataService(data, performanceSheetId, isEditing);
  const { state, handleFieldChange, getFieldValue, getFieldError } = dataService;
  const { localData, fieldErrors, isDirty, lastSaved, isLoading, error } = state;

  // Required fields list
  const requiredFields = [
    'referenceNumber', 'rfq.dates.date', 'common.customer', 'common.customerInfo.state',
    'common.customerInfo.streetAddress', 'common.customerInfo.zip', 'common.customerInfo.city',
    'common.customerInfo.country', 'common.customerInfo.contactName', 'common.customerInfo.position',
    'common.customerInfo.phoneNumber', 'common.customerInfo.email', 'common.customerInfo.dealerName',
    'common.customerInfo.dealerSalesman', 'rfq.dates.idealDeliveryDate', 'rfq.dates.decisionDate',
    'feed.feed.application', 'common.equipment.feed.typeOfLine', 'feed.feed.pullThru.isPullThru',
    'rfq.runningCosmeticMaterial', 'common.coil.maxCoilWidth', 'common.coil.minCoilWidth',
    'common.coil.maxCoilOD', 'common.coil.coilID', 'common.coil.maxCoilWeight', 'rfq.coil.slitEdge',
    'rfq.coil.millEdge', 'rfq.coil.requireCoilCar', 'rfq.coil.runningOffBackplate',
    'rfq.coil.requireRewinding', 'rfq.coil.changeTimeConcern', 'rfq.coil.loading',
    'common.material.materialThickness', 'common.material.coilWidth', 'common.material.materialType',
    'common.material.maxYieldStrength', 'rfq.press.maxSPM', 'rfq.dies.transferDies',
    'rfq.dies.progressiveDies', 'rfq.dies.blankingDies', 'common.feedRates.average.length',
    'common.feedRates.average.spm', 'common.feedRates.average.fpm', 'common.feedRates.max.length',
    'common.feedRates.max.spm', 'common.feedRates.max.fpm', 'common.feedRates.min.length',
    'common.feedRates.min.spm', 'common.feedRates.min.fpm', 'rfq.voltageRequired',
    'rfq.equipmentSpaceLength', 'rfq.equipmentSpaceWidth', 'rfq.obstructions',
    'common.equipment.feed.direction', 'rfq.requireGuarding'
  ];

  // Function to save form data before section reset
  const saveFormData = useCallback(() => {
    try {
      // Save current form state to session storage as backup
      const backupData = {
        data: localData,
        timestamp: new Date().toISOString(),
        performanceSheetId,
      };
      sessionStorage.setItem('rfq-form-backup', JSON.stringify(backupData));
    } catch (error) {
      console.warn('Could not save form backup:', error);
    }
  }, [localData, performanceSheetId]);

  // Function to get background color for required fields (using shared utility)
  const getFieldBackgroundColor = useCallback((fieldName: string) => {
    return getRequiredFieldBackgroundColor(fieldName, requiredFields, getFieldValue);
  }, [requiredFields, getFieldValue]);

  // Status indicator component
  const StatusIndicator = () => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
          Saving...
        </div>
      );
    }

    if (isDirty) {
      return (
        <div className="flex items-center gap-2 text-sm text-amber-600">
          <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
          Unsaved changes
        </div>
      );
    }

    if (lastSaved) {
      return (
        <div className="flex items-center gap-2 text-sm text-green-600">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          Saved {lastSaved.toLocaleTimeString()}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full flex flex-1 flex-col px-2 pb-2 gap-2">
      {/* Status bar */}
      <div className="flex justify-between items-center p-2 bg-muted rounded-md">
        <StatusIndicator />
        {fieldErrors._general && (
          <div className="text-sm text-red-600">{fieldErrors._general}</div>
        )}
      </div>

      {(error) && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3 mb-4">
          <span className="text-red-800">
            Error: {error}
          </span>
        </div>
      )}

      {/* Form sections */}
      <RFQErrorBoundary sectionName="Basic Info" onSaveBeforeReset={saveFormData}>
        <BasicInfoSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Line Configuration" onSaveBeforeReset={saveFormData}>
        <LineConfigSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Coil Specifications" onSaveBeforeReset={saveFormData}>
        <CoilSpecsSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Material Specifications" onSaveBeforeReset={saveFormData}>
        <MaterialSpecsSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Press Information" onSaveBeforeReset={saveFormData}>
        <PressInfoSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Dies Information" onSaveBeforeReset={saveFormData}>
        <DiesInfoSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Feed Requirements" onSaveBeforeReset={saveFormData}>
        <FeedRequirementsSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Space & Mounting" onSaveBeforeReset={saveFormData}>
        <SpaceMountingSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>

      <RFQErrorBoundary sectionName="Special Requirements" onSaveBeforeReset={saveFormData}>
        <SpecialRequirementsSection
          localData={localData}
          fieldErrors={fieldErrors}
          handleFieldChange={handleFieldChange}
          getFieldBackgroundColor={getFieldBackgroundColor}
          getFieldError={getFieldError}
          isEditing={isEditing}
        />
      </RFQErrorBoundary>
    </div>
  );
};

export default RFQ;
