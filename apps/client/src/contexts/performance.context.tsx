import React, { createContext, useContext, useState, ReactNode } from 'react';
import { RFQFormData } from '@/hooks/performance/use-create-rfq';

// Extend with avgFPM, maxFPM, minFPM as in rfq.tsx
export type PerformanceSheetState = RFQFormData & {
  avgFPM?: string;
  maxFPM?: number;
  minFPM?: string;
  // Material Specs fields (unique only, do not repeat maxFPM/minFPM)
  materialType?: string;
  thickness?: string;
  width?: string;
  yieldStrength?: string;
  tensileStrength?: string;
  customer?: string;
  coilWeight?: number;
  minBendRad?: string;
  minLoopLength?: string;
  coilOD?: number;
  coilID?: number;
  coilODCaclculated?: string;
  controlsLevel?: string;
  typeOfLine?: string;
  feedControls?: string;
  passline?: string;
  typeOfRoll?: string;
  reelBackplate?: string;
  reelStyle?: string;
  lightGauge?: boolean;
  nonMarking?: boolean;
  // Add per-version objects for material specs
  MaximumThick?: { [key: string]: any };
  MaxAtFull?: { [key: string]: any };
  MinimumThick?: { [key: string]: any };
  MaxAtWidth?: { [key: string]: any };
  // Add required RFQFormData properties
  coilWidthMax?: number;
  coilWidthMin?: number;
  coilODMax?: number;
  // Add any other required RFQFormData properties here, using undefined or '' as appropriate
  slitEdge: boolean;
  millEdge: boolean;
  coilCarRequired: string;
  runOffBackplate: string;
  requireRewinding: string;
  matSpec1: { thickness: string; width: string; type: string; yield: string; tensile: string };
  matSpec2: { thickness: string; width: string; type: string; yield: string; tensile: string };
  matSpec3: { thickness: string; width: string; type: string; yield: string; tensile: string };
  matSpec4: { thickness: string; width: string; type: string; yield: string; tensile: string };
  cosmeticMaterial: string;
  feedEquipment: string;
  pressType: {
    gapFrame: boolean;
    hydraulic: boolean;
    obi: boolean;
    servo: boolean;
    shearDie: boolean;
    straightSide: boolean;
    other: boolean;
    otherText: string;
  };
  tonnage: string;
  pressBedWidth: string;
  pressBedLength: string;
  pressStroke: string;
  windowOpening: string;
  maxSPM: string;
  dies: {
    transfer: boolean;
    progressive: boolean;
    blanking: boolean;
  };
  avgFeedLen: string;
  avgFeedSPM: string;
  maxFeedLen: string;
  maxFeedSPM: string;
  minFeedLen: string;
  minFeedSPM: string;
  voltage: string;
  spaceLength: string;
  spaceWidth: string;
  obstructions: string;
  mountToPress: string;
  adequateSupport: string;
  requireCabinet: string;
  needMountingPlates: string;
  passlineHeight: string;
  loopPit: string;
  coilChangeConcern: string;
  coilChangeTime: string;
  downtimeReasons: string;
  feedDirection: string;
  coilLoading: string;
  safetyRequirements: string;
  decisionDate: string;
  idealDelivery: string;
  earliestDelivery: string;
  latestDelivery: string;
  specialConsiderations: string;
};

const initialState: PerformanceSheetState = {
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
  lineApplication: '',
  lineType: '',
  pullThrough: 'No',
  // Add required RFQFormData properties
  coilWidthMax: 0,
  coilWidthMin: 0,
  coilODMax: 0,
  coilID: 0,
  // Add any other required RFQFormData properties here, using 0 or '' as appropriate
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
  avgFPM: '',
  minFPM: '',
  // Material Specs fields (unique only, do not repeat maxFPM/minFPM)
  materialType: '',
  thickness: '',
  width: '',
  yieldStrength: '',
  tensileStrength: '',
  customer: '',
  minBendRad: '',
  minLoopLength: '',
  coilODCaclculated: '',
  controlsLevel: '',
  typeOfLine: '',
  feedControls: '',
  passline: '',
  typeOfRoll: '',
  reelBackplate: '',
  reelStyle: '',
  lightGauge: false,
  nonMarking: false,
  MaximumThick: {},
  MaxAtFull: {},
  MinimumThick: {},
  MaxAtWidth: {},
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