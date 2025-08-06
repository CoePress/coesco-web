import { useCallback } from 'react';
import { PerformanceData, usePerformanceSheet } from '@/contexts/performance.context';
import { useParams } from 'react-router-dom';

export const usePerformanceCalculations = () => {
  // All hooks must be called at the top level, in the same order every time
  const params = useParams();
  const { updatePerformanceData } = usePerformanceSheet();
  
  // Extract the ID once at the top
  const performanceSheetId = params.performanceSheetId || params.id || params.sheetId;
  
  console.log('All URL params:', params);
  console.log('Current performanceSheetId:', performanceSheetId);
  
  // Define required fields function (not a hook)
  const getRequiredFields = (calculationType: string) => {
    switch (calculationType) {
      case 'rfq':
      case 'material-specs':
        return {
          material: ['materialType', 'materialThickness', 'maxYieldStrength', 'coilWidth'],
          coil: ['maxCoilWeight', 'coilID']
        };
      
      case 'feed':
        return {
          material: ['coilWidth', 'materialThickness'],
          feed: ['model', 'machineWidth']
        };
      
      case 'reel-drive':
        return {
          reel: ['model', 'horsepower', 'width'],
          coil: ['maxCoilWeight', 'maxCoilOD', 'coilID'],
          material: ['coilWidth']
        };
      
      case 'str-utility':
        return {
          straightener: ['model', 'width', 'horsepower', 'feedRate'],
          material: ['coilWidth', 'materialThickness', 'maxYieldStrength', 'materialType'],
          coil: ['coilID']
        };
      
      case 'roll-str-backbend':
        return {
          material: ['coilWidth', 'materialThickness', 'maxYieldStrength', 'materialType'],
          straightener: ['model', 'rollDiameter', 'centerDistance', 'modulus', 'jackForceAvailable']
        };
      
      case 'shear':
        return {
          material: ['materialThickness', 'coilWidth', 'maxTensileStrength'],
          shear: ['model']
        };
      
      case 'tddbhd':
        return {
          reel: ['model', 'width'],
          material: ['materialType', 'coilWidth', 'materialThickness', 'maxYieldStrength'],
          coil: ['maxCoilWeight', 'maxCoilOD']
        };
      
      default:
        return {};
    }
  };

  // All useCallback hooks in the same order every time
  const hasRequiredFields = useCallback((data: PerformanceData, calculationType: string): boolean => {
    const requiredFields = getRequiredFields(calculationType);
    
    for (const [section, fields] of Object.entries(requiredFields)) {
      const sectionData = data[section as keyof PerformanceData];
      
      if (!sectionData || typeof sectionData !== 'object') {
        return false;
      }
      
      for (const field of fields) {
        const value = (sectionData as any)[field];
        if (value === null || value === undefined || value === '' || value === 0) {
          return false;
        }
      }
    }
    
    return true;
  }, []);

  const triggerCalculation = useCallback(async (
    data: PerformanceData, 
    calculationType: string,
    specificData?: Partial<PerformanceData>
  ) => {
    console.log(`triggerCalculation called for ${calculationType}`);
    console.log('performanceSheetId:', performanceSheetId);
    console.log('hasRequiredFields result:', hasRequiredFields(data, calculationType));
    
    // Check if we have required fields
    if (!hasRequiredFields(data, calculationType) || !performanceSheetId) {
      console.log(`Cannot trigger ${calculationType}:`, {
        hasRequired: hasRequiredFields(data, calculationType),
        hasId: !!performanceSheetId,
        performanceSheetId: performanceSheetId
      });
      return null;
    }

    try {
      // Merge specific data if provided
      const calculationData = specificData ? { ...data, ...specificData } : data;
      
      // Add calculation type metadata
      const payload = {
        ...calculationData,
        referenceNumber: calculationData.referenceNumber || '',
        calculationType,
      };

      console.log(`Sending ${calculationType} calculation payload to updatePerformanceData`);
      
      const results = await updatePerformanceData(payload);
      
      console.log(`${calculationType} calculation backend response:`, results);
      
      return results;
    } catch (error) {
      console.error(`Error in ${calculationType} calculation:`, error);
      return null;
    }
  }, [performanceSheetId, updatePerformanceData, hasRequiredFields]);

  const triggerRFQCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'rfq');
  }, [triggerCalculation]);

  const triggerMaterialSpecsCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'material-specs');
  }, [triggerCalculation]);

  const triggerFeedCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'feed');
  }, [triggerCalculation]);

  const triggerReelDriveCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'reel-drive');
  }, [triggerCalculation]);

  const triggerStrUtilityCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'str-utility');
  }, [triggerCalculation]);

  const triggerRollStrBackbendCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'roll-str-backbend');
  }, [triggerCalculation]);

  const triggerShearCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'shear');
  }, [triggerCalculation]);

  const triggerTDDBHDCalculation = useCallback((data: PerformanceData) => {
    return triggerCalculation(data, 'tddbhd');
  }, [triggerCalculation]);

  const triggerFPMCalculation = useCallback(async (
    data: PerformanceData,
    feedLength: number,
    spm: number,
    type: 'average' | 'min' | 'max'
  ) => {
    if (!feedLength || !spm || !performanceSheetId) {
      return null;
    }

    const fpmData = {
      ...data,
      feed: {
        ...data.feed,
        [type]: {
          ...data.feed?.[type],
          length: feedLength,
          spm: spm,
        }
      }
    };

    return triggerCalculation(fpmData, 'fpm');
  }, [triggerCalculation, performanceSheetId]);

  return {
    hasRequiredFields,
    triggerCalculation,
    triggerRFQCalculation,
    triggerMaterialSpecsCalculation,
    triggerFeedCalculation,
    triggerReelDriveCalculation,
    triggerStrUtilityCalculation,
    triggerRollStrBackbendCalculation,
    triggerShearCalculation,
    triggerTDDBHDCalculation,
    triggerFPMCalculation,
  };
};