import { useEffect, useRef } from 'react';
import { PerformanceData } from '@/contexts/performance.context';
import { usePerformanceCalculations } from './use-performance-calculations';

export const useAutoCalculations = (
  data: PerformanceData,
  calculationType: string,
  onChange?: (updates: Partial<PerformanceData>) => void,
  debounceMs: number = 1000
) => {
  // All hooks at the top level, same order every time
  const { hasRequiredFields, triggerCalculation } = usePerformanceCalculations();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastCalculationRef = useRef<string>('');

  console.log(`useAutoCalculations triggered for ${calculationType}`, data);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Create a hash of relevant data to avoid unnecessary calculations
    const dataHash = JSON.stringify({
      calculationType,
      ...data
    });

    // Skip if data hasn't changed
    if (dataHash === lastCalculationRef.current) {
      console.log(`Skipping ${calculationType} - data unchanged`);
      return;
    }

    // Check if we have required fields
    const hasRequired = hasRequiredFields(data, calculationType);
    console.log(`${calculationType} has required fields:`, hasRequired);
    
    if (!hasRequired) {
      console.log(`Missing required fields for ${calculationType}`);
      return;
    }

    console.log(`Setting timeout for ${calculationType} calculation...`);

    // Debounce the calculation
    timeoutRef.current = setTimeout(async () => {
      lastCalculationRef.current = dataHash;
      
      console.log(`Executing ${calculationType} calculation...`);
      
      try {
        const results = await triggerCalculation(data, calculationType);
        
        console.log(`${calculationType} calculation raw results:`, results);
        
        if (results && onChange) {
          // Extract relevant calculated data based on calculation type
          const updates = extractCalculatedUpdates(results, calculationType);
          console.log(`${calculationType} extracted updates:`, updates);
          
          if (updates) {
            console.log(`Calling onChange for ${calculationType} with:`, updates);
            onChange(updates);
          } else {
            console.log(`No updates extracted for ${calculationType}`);
          }
        } else {
          console.log(`No results or onChange for ${calculationType}`, { results: !!results, onChange: !!onChange });
        }
      } catch (error) {
        console.error(`Auto-calculation error for ${calculationType}:`, error);
      }
    }, debounceMs);

    // Cleanup timeout on unmount
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [data, calculationType, hasRequiredFields, triggerCalculation, onChange, debounceMs]);
};

// Helper function to extract relevant updates based on calculation type
const extractCalculatedUpdates = (results: any, calculationType: string): Partial<PerformanceData> | null => {
  if (!results || !results.parsed) {
    return null;
  }

  const parsed = results.parsed;
  const updates: Partial<PerformanceData> = {};

  switch (calculationType) {
    case 'rfq':
    case 'material-specs':
      if (parsed.rfq) {
        updates.feed = {
          ...updates.feed,
          average: { ...updates.feed?.average, fpm: parsed.rfq.average?.fpm },
          min: { ...updates.feed?.min, fpm: parsed.rfq.min?.fpm },
          max: { ...updates.feed?.max, fpm: parsed.rfq.max?.fpm },
        };
      }
      if (parsed.material) {
        updates.material = {
          ...updates.material,
          ...parsed.material
        };
      }
      break;

    case 'feed':
      if (parsed.feed) {
        updates.feed = {
          ...updates.feed,
          ...parsed.feed
        };
      }
      break;

    case 'reel-drive':
      if (parsed.reel) {
        updates.reel = {
          ...updates.reel,
          ...parsed.reel
        };
      }
      break;

    case 'str-utility':
      if (parsed.straightener) {
        updates.straightener = {
          ...updates.straightener,
          ...parsed.straightener
        };
      }
      break;

    case 'roll-str-backbend':
      if (parsed.straightener?.rolls?.backbend) {
        updates.straightener = {
          ...updates.straightener,
          rolls: {
            ...updates.straightener?.rolls,
            backbend: parsed.straightener.rolls.backbend
          }
        };
      }
      break;

    case 'shear':
      if (parsed.shear) {
        updates.shear = {
          ...updates.shear,
          ...parsed.shear
        };
      }
      break;

    case 'tddbhd':
      if (parsed.reel) {
        updates.reel = {
          ...updates.reel,
          ...parsed.reel
        };
      }
      break;

    default:
      return null;
  }

  return Object.keys(updates).length > 0 ? updates : null;
};