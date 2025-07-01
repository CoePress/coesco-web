import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RFQFormData } from '@/hooks/performance/use-create-rfq';

// RFQ variables (flat fields)
export type PerformanceSheetState = RFQFormData & {
  // --- Material Specs versioned fields ---
  MaximumThick: MaterialSpecsVersion;
  MaxAtFull: MaterialSpecsVersion;
  MinimumThick: MaterialSpecsVersion;
  MaxAtWidth: MaterialSpecsVersion;
  // --- Material Specs top-level fields ---
  controlsLevel?: string;
  typeOfLine?: string;
  feedControls?: string;
  passline?: string;
  typeOfRoll?: string;
  reelBackplate?: string;
  reelStyle?: string;
  lightGauge?: boolean;
  nonMarking?: boolean;
};

// Versioned material specs fields for each version
export type MaterialSpecsVersion = {
  materialType: string;
  thickness: string;
  width: string;
  yieldStrength: string;
  tensileStrength: string;
  coilID: string;
  coilOD: string;
  coilWeight: string;
  minBendRad: string;
  minLoopLength: string;
  coilODCalculated: string;
};

// Initial state for a versioned material spec
const initialMaterialSpecsVersion: MaterialSpecsVersion = {
  materialType: '',
  thickness: '',
  width: '',
  yieldStrength: '',
  tensileStrength: '',
  coilID: '',
  coilOD: '',
  coilWeight: '',
  minBendRad: '',
  minLoopLength: '',
  coilODCalculated: '',
};

// Initial state for the context
const initialState: PerformanceSheetState = {
  // --- RFQ variables (from lines 14-100 in rfq.tsx) ---
  referenceNumber: '',
  date: '',
  companyName: '',
  streetAddress: '',
  city: '',
  state: '',
  zip: '',
  country: '',
  contactName: '',
  position: '',
  phone: '',
  email: '',
  dealerName: '',
  dealerSalesman: '',
  daysPerWeek: '',
  shiftsPerDay: '',
  lineApplication: 'Press Feed',
  lineType: 'Conventional',
  pullThrough: 'No',
  coilWidthMin: '',
  coilWidthMax: '',
  maxCoilOD: '',
  coilID: '',
  coilWeightMax: '',
  coilHandlingMax: '',
  slitEdge: false,
  millEdge: false,
  coilCarRequired: 'No',
  runOffBackplate: 'No',
  requireRewinding: 'No',
  matSpec1: { thickness: '', width: '', type: '', yield: '', tensile: '' },
  matSpec2: { thickness: '', width: '', type: '', yield: '', tensile: '' },
  matSpec3: { thickness: '', width: '', type: '', yield: '', tensile: '' },
  matSpec4: { thickness: '', width: '', type: '', yield: '', tensile: '' },
  cosmeticMaterial: 'No',
  feedEquipment: '',
  pressType: {
    gapFrame: false,
    hydraulic: false,
    obi: false,
    servo: false,
    shearDie: false,
    straightSide: false,
    other: false,
    otherText: '',
  },
  tonnage: '',
  pressBedWidth: '',
  pressBedLength: '',
  pressStroke: '',
  windowOpening: '',
  maxSPM: '',
  dies: {
    transfer: false,
    progressive: false,
    blanking: false,
  },
  avgFeedLen: '',
  avgFeedSPM: '',
  maxFeedLen: '',
  maxFeedSPM: '',
  minFeedLen: '',
  minFeedSPM: '',
  voltage: '',
  spaceLength: '',
  spaceWidth: '',
  obstructions: '',
  mountToPress: '',
  adequateSupport: '',
  requireCabinet: '',
  needMountingPlates: '',
  passlineHeight: '',
  loopPit: '',
  coilChangeConcern: '',
  coilChangeTime: '',
  downtimeReasons: '',
  feedDirection: '',
  coilLoading: '',
  safetyRequirements: '',
  decisionDate: '',
  idealDelivery: '',
  earliestDelivery: '',
  latestDelivery: '',
  specialConsiderations: '',
  // --- Material Specs versioned fields ---
  MaximumThick: { ...initialMaterialSpecsVersion },
  MaxAtFull: { ...initialMaterialSpecsVersion },
  MinimumThick: { ...initialMaterialSpecsVersion },
  MaxAtWidth: { ...initialMaterialSpecsVersion },
  // --- Material Specs top-level fields ---
  controlsLevel: '',
  typeOfLine: '',
  feedControls: '',
  passline: '',
  typeOfRoll: '',
  reelBackplate: '',
  reelStyle: '',
  lightGauge: false,
  nonMarking: false,
};

interface PerformanceSheetContextType {
  performanceSheet: PerformanceSheetState;
  setPerformanceSheet: React.Dispatch<React.SetStateAction<PerformanceSheetState>>;
  updatePerformanceSheet: (updates: Partial<PerformanceSheetState>) => void;
}

const PerformanceSheetContext = createContext<PerformanceSheetContextType | undefined>(undefined);

export const PerformanceSheetProvider = ({ children }: { children: ReactNode }) => {
  const [performanceSheet, setPerformanceSheet] = useState<PerformanceSheetState>(initialState);

  const updatePerformanceSheet = (updates: Partial<PerformanceSheetState>) => {
    setPerformanceSheet((prev) => ({ ...prev, ...updates }));
  };

  return (
    <PerformanceSheetContext.Provider value={{ performanceSheet, setPerformanceSheet, updatePerformanceSheet }}>
      {children}
    </PerformanceSheetContext.Provider>
  );
};

export const usePerformanceSheet = () => {
  const ctx = useContext(PerformanceSheetContext);
  if (!ctx) throw new Error('usePerformanceSheet must be used within a PerformanceSheetProvider');
  return ctx;
};

export { initialState }; 