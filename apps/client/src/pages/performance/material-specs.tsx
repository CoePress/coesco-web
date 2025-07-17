import { useEffect, useState, useRef } from "react";
import Input from "@/components/common/input";
import Select from "@/components/common/select";
import Checkbox from "@/components/common/checkbox";
import Text from "@/components/common/text";
import Tabs from "@/components/common/tabs";
import { Button, Card } from "@/components";
import { useCreateMaterialSpecs, calculateMaterialSpecs, calculateMaterialSpecsVariant } from "@/hooks/performance/use-create-material-specs";
import { useGetMaterialSpecs } from "@/hooks/performance/use-get-material-specs";
import { snakeToCamel } from "@/utils";
import { usePerformanceSheet, PerformanceSheetState } from '@/contexts/performance.context';
import { mapBackendToFrontendMaterialSpecsUniversal, mapFrontendToBackendMaterialSpecs } from '@/utils/material-specs-mapping';
import { useGetTDDBHD } from '@/hooks/performance/use-get-tddbhd';
import { mapBackendToFrontendTDDBHD } from './tddbhd';
import { useGetReelDrive } from '@/hooks/performance/use-get-reel-drive';
import { mapBackendToFrontendReelDrive } from './reel-drive';
import {
  FEED_DIRECTION_OPTIONS,
  CONTROLS_LEVEL_OPTIONS,
  TYPE_OF_LINE_OPTIONS,
  PASSLINE_OPTIONS,
  ROLL_TYPE_OPTIONS,
  REEL_BACKPLATE_OPTIONS,
  REEL_STYLE_OPTIONS,
  MATERIAL_TYPE_OPTIONS,
} from '@/utils/select-options';

const VERSIONS = [
  "Maximum Thick",
  "Max @ Full",
  "Minimum Thick",
  "Max @ Width",
] as const;

type VersionKey = typeof VERSIONS[number];

const MATERIAL_SPECS_FIELDS = {
  'Maximum Thick': [
    'coilWidth', 'coilWeight', 'materialThickness', 'materialType', 'yieldStrength', 'materialTensile', 'maxFPM', 'minBendRad', 'minLoopLength', 'coilOD', 'coilID', 'coilODCalculated'
  ],
  'Max @ Full': [
    'coilWidth', 'coilWeight', 'materialThickness', 'materialType', 'yieldStrength', 'materialTensile', 'maxFPM', 'minBendRad', 'minLoopLength', 'coilOD', 'coilID', 'coilODCalculated'
  ],
  'Minimum Thick': [
    'coilWidth', 'coilWeight', 'materialThickness', 'materialType', 'yieldStrength', 'materialTensile', 'maxFPM', 'minBendRad', 'minLoopLength', 'coilOD', 'coilID', 'coilODCalculated'
  ],
  'Max @ Width': [
    'coilWidth', 'coilWeight', 'materialThickness', 'materialType', 'yieldStrength', 'materialTensile', 'maxFPM', 'minBendRad', 'minLoopLength', 'coilOD', 'coilID', 'coilODCalculated'
  ]
};
const FIELD_LABELS: { [key: string]: string } = {
  coilWidth: 'Coil Width (in)',
  coilWeight: 'Coil Weight (Max)',
  materialThickness: 'Material Thickness (in)',
  materialType: 'Material Type',
  yieldStrength: 'Yield Strength (psi)',
  materialTensile: 'Material Tensile (psi)',
  maxFPM: 'Required Maximum FPM',
  minBendRad: 'Minimum Bend Radius (in)',
  minLoopLength: 'Min Loop Length (ft)',
  coilOD: 'Coil O.D.',
  coilID: 'Coil I.D.',
  coilODCalculated: 'Coil O.D. Calculated'
};

const versionKeyMap = {
  'Maximum Thick': 'maxThick',
  'Max @ Full': 'atFull',
  'Minimum Thick': 'minThick',
  'Max @ Width': 'atWidth',
} as const;

function mapPerformanceSheetToMaterialSpecsFormData(form: PerformanceSheetState, currentVersion: 'Maximum Thick' | 'Max @ Full' | 'Minimum Thick' | 'Max @ Width' = 'Maximum Thick'): any {
  const versionKey = versionKeyMap[currentVersion];
  const versionData = form[versionKey] || {};
  
  // Create base data object
  const baseData = {
    referenceNumber: form.referenceNumber || '',
    customer: form.customer || '', // customer and customer are the same
    date: form.date || '',
    coil_id: versionData.coilID || '',
    feed_direction: form.feedDirection || '',
    controls_level: form.controlsLevel || '',
    type_of_line: form.typeOfLine || '',
    feed_controls: form.feedControls || '',
    passline: form.passline || '',
    selected_roll: form.typeOfRoll || '',
    reel_backplate: form.reelBackplate || '',
    reel_style: form.reelStyle || '',
    light_guage: form.lightGauge || false,
    non_marking: form.nonMarking || false,
  };

  // Add version-specific fields based on current version
  switch (currentVersion) {
    case 'Maximum Thick':
      return {
        ...baseData,
        max_coil_width: versionData.coilWidth || '',
        max_coil_weight: versionData.coilWeight || '',
        max_material_thickness: versionData.materialThickness || '',
        max_material_type: versionData.materialType || '',
        max_yield_strength: versionData.yieldStrength || '',
        max_tensile_strength: versionData.materialTensile || '',
        max_fpm: '', // Add FPM field for max version
        max_min_bend_rad: versionData.minBendRad || '',
        max_min_loop_length: versionData.minLoopLength || '',
        max_coil_od: versionData.coilOD || '',
        max_coil_od_calculated: versionData.coilODCalculated || '',
        // Backward compatibility aliases
        coil_width_max: versionData.coilWidth ? Number(versionData.coilWidth) : undefined,
        coil_weight_max: form.coilWeightMax ? Number(form.coilWeightMax) : undefined,
      };
    
    case 'Max @ Full':
      return {
        ...baseData,
        full_coil_width: versionData.coilWidth || '',
        full_coil_weight: versionData.coilWeight || '',
        full_material_thickness: versionData.materialThickness || '',
        full_material_type: versionData.materialType || '',
        full_yield_strength: versionData.yieldStrength || '',
        full_tensile_strength: versionData.materialTensile || '',
        full_fpm: '', // Add FPM field for full version
        full_min_bend_rad: versionData.minBendRad || '',
        full_min_loop_length: versionData.minLoopLength || '',
        full_coil_od: versionData.coilOD || '',
        full_coil_od_calculated: versionData.coilODCalculated || '',
      };
    
    case 'Minimum Thick':
      return {
        ...baseData,
        min_coil_width: versionData.coilWidth || '',
        min_coil_weight: versionData.coilWeight || '',
        min_material_thickness: versionData.materialThickness || '',
        min_material_type: versionData.materialType || '',
        min_yield_strength: versionData.yieldStrength || '',
        min_tensile_strength: versionData.materialTensile || '',
        min_fpm: '', // Add FPM field for min version
        min_min_bend_rad: versionData.minBendRad || '',
        min_min_loop_length: versionData.minLoopLength || '',
        min_coil_od: versionData.coilOD || '',
        min_coil_od_calculated: versionData.coilODCalculated || '',
      };
    
    case 'Max @ Width':
      return {
        ...baseData,
        width_coil_width: versionData.coilWidth || '',
        width_coil_weight: versionData.coilWeight || '',
        width_material_thickness: versionData.materialThickness || '',
        width_material_type: versionData.materialType || '',
        width_yield_strength: versionData.yieldStrength || '',
        width_tensile_strength: versionData.materialTensile || '',
        width_fpm: '', // Add FPM field for width version
        width_min_bend_rad: versionData.minBendRad || '',
        width_min_loop_length: versionData.minLoopLength || '',
        width_coil_od: versionData.coilOD || '',
        width_coil_od_calculated: versionData.coilODCalculated || '',
      };
    
    default:
      return baseData;
  }
}

const REQUIRED_FIELDS = [
  "coilWeight", "coilID", "materialType", "materialThickness", "yieldStrength", "coilWidth"
];

function hasAllRequiredFields(versionData: any) {
  return (
    versionData.coilWeight &&
    versionData.coilID &&
    versionData.materialType &&
    (versionData.materialThickness || versionData.thickness) &&
    versionData.yieldStrength &&
    (versionData.coilWidth || versionData.width)
  );
}

const MaterialSpecs = () => {
  const { performanceSheet, updatePerformanceSheet, setPerformanceSheet } = usePerformanceSheet();
  const { isLoading, status, errors, createMaterialSpecs, updateMaterialSpecs } = useCreateMaterialSpecs();
  const { isLoading: isGetting, status: getStatus, fetchedMaterialSpecs, getMaterialSpecs } = useGetMaterialSpecs();
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const { getTDDBHD } = useGetTDDBHD();
  const { getReelDrive } = useGetReelDrive();

  // Get coil width boundaries from RFQ form (as numbers)
  const coilWidthMin = Number(performanceSheet.coilWidthMin) || undefined;
  const coilWidthMax = Number(performanceSheet.coilWidthMax) || undefined;

  useEffect(() => {
    if (fetchedMaterialSpecs) {
      const mapped = mapBackendToFrontendMaterialSpecsUniversal(fetchedMaterialSpecs);
      setPerformanceSheet((prev) => ({
        ...prev,
        ...mapped
      }));
      // Also fetch TDDBHD and Reel Drive and update context
      const refNum = performanceSheet.referenceNumber || (mapped as any).referenceNumber;
      if (refNum) {
        console.log('Fetching TDDBHD with refNum:', refNum);
        getTDDBHD(refNum).then((tddbhdData) => {
          console.log('TDDBHD backend data:', tddbhdData);
          if (tddbhdData) {
            setPerformanceSheet(prev => ({
              ...prev,
              tddbhd: mapBackendToFrontendTDDBHD(tddbhdData, prev.tddbhd)
            }));
          }
        });
        console.log('Fetching Reel Drive with refNum:', refNum);
        getReelDrive(refNum).then((reelDriveData) => {
          console.log('Reel Drive backend data:', reelDriveData);
          if (reelDriveData) {
            setPerformanceSheet(prev => ({
              ...prev,
              reelDrive: mapBackendToFrontendReelDrive(reelDriveData, prev.reelDrive)
            }));
          }
        });
      }
    }
  }, [fetchedMaterialSpecs, setPerformanceSheet]);

  const currentVersionKey = versionKeyMap['Maximum Thick'];
  const versionData = performanceSheet[currentVersionKey as keyof PerformanceSheetState] || {};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'referenceNumber') {
      updatePerformanceSheet({ referenceNumber: value });
      return;
    }
    // Handle top-level fields
    const topLevelFields = [
      'passline', 'feedDirection', 'controlsLevel', 'typeOfLine', 'feedControls',
      'reelBackplate', 'reelStyle', 'lightGauge', 'nonMarking', 'customer', 'date'
    ];
    if (topLevelFields.includes(name)) {
      updatePerformanceSheet({ [name]: value });
      return;
    }
    // Otherwise, update versioned fields
    let updatedVersionData;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updatedVersionData = {
        ...performanceSheet[currentVersionKey],
        [name]: checked
      };
      updatePerformanceSheet({
        [currentVersionKey]: updatedVersionData
      });
    } else if (type === 'number') {
      updatedVersionData = {
        ...performanceSheet[currentVersionKey],
        [name]: value === '' ? undefined : parseFloat(value)
      };
      updatePerformanceSheet({
        [currentVersionKey]: updatedVersionData
      });
    } else {
      updatedVersionData = {
        ...performanceSheet[currentVersionKey],
        [name]: value
      };
      updatePerformanceSheet({
        [currentVersionKey]: updatedVersionData
      });
    }
    // Trigger calculation if all required fields are present
    if (hasAllRequiredFields(updatedVersionData)) {
      triggerCalculation(currentVersionKey, updatedVersionData);
    }
  };

  const triggerCalculation = async (versionKey: string, versionData: any) => {
    let coilWeight = performanceSheet.coilWeightMax !== undefined && performanceSheet.coilWeightMax !== null && performanceSheet.coilWeightMax !== ''
      ? Number(performanceSheet.coilWeightMax)
      : (versionData.coilWeight !== undefined && versionData.coilWeight !== null && versionData.coilWeight !== ''
          ? Number(versionData.coilWeight)
          : 0);

    const payload = {
      material_type: typeof versionData.materialType === 'string' ? versionData.materialType : '',
      material_thickness: Number(versionData.materialThickness ?? versionData.thickness ?? 0),
      yield_strength: Number(versionData.yieldStrength ?? 0),
      material_width: Number(versionData.coilWidth ?? versionData.width ?? 0),
      coil_weight_max: coilWeight,
      coil_id: Number(versionData.coilID ?? 0),
    };

    // Guard: Only send if all required fields are present and valid
    const allValid = (
      typeof payload.material_type === 'string' && payload.material_type.trim() !== '' &&
      typeof payload.material_thickness === 'number' && !isNaN(payload.material_thickness) && payload.material_thickness > 0 &&
      typeof payload.yield_strength === 'number' && !isNaN(payload.yield_strength) && payload.yield_strength > 0 &&
      typeof payload.material_width === 'number' && !isNaN(payload.material_width) && payload.material_width > 0 &&
      typeof payload.coil_weight_max === 'number' && !isNaN(payload.coil_weight_max) && payload.coil_weight_max > 0 &&
      typeof payload.coil_id === 'number' && !isNaN(payload.coil_id) && payload.coil_id > 0
    );
    if (!allValid) {
      return;
    }

    // Call backend
    try {
      const result = await calculateMaterialSpecsVariant(payload);
      // Update only the calculated fields for this version
      updatePerformanceSheet({
        [versionKey as keyof PerformanceSheetState]: {
          ...((performanceSheet[versionKey as keyof PerformanceSheetState] as object) || {}),
          minBendRad: result['min_bend_rad'],
          minLoopLength: result['min_loop_length'],
          coilODCalculated: result['coil_od_calculated'],
        },
      });
    } catch (e) {
      // Optionally handle error
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
    // Only trigger on required fields
    const { name } = e.target;
    if (!REQUIRED_FIELDS.includes(name)) return;
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      const versionData = performanceSheet[currentVersionKey as keyof PerformanceSheetState] || {};
      if (hasAllRequiredFields(versionData)) {
        triggerCalculation(currentVersionKey, versionData);
      }
    }, 400); // Debounce to avoid rapid calls
  };

  // Send data to backend - always update/merge, whether specs exist or not
  const handleSendData = async () => {
    try {
      // Map the entire form to backend payload (all versions)
      const mapped = mapFrontendToBackendMaterialSpecs(performanceSheet);
      
      if (fetchedMaterialSpecs) {
        // Update existing specs (merge with existing data)
        await updateMaterialSpecs(performanceSheet.referenceNumber, mapped);
      } else {
        // Create new specs
        await createMaterialSpecs(mapped);
      }
    } catch (error) {
      console.error('[MaterialSpecs] Error in handleSendData:', error);
    }
  };

  // Only fetch material specs, do not create
  const handleGet = async () => {
    const data = await getMaterialSpecs(performanceSheet.referenceNumber);
  };

  return (
    <div className="w-full flex flex-1 flex-col p-2 gap-2">
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Reference" 
            required
            name="referenceNumber" 
            value={performanceSheet.referenceNumber}
            onChange={e => updatePerformanceSheet({ referenceNumber: e.target.value })}
            error={errors.referenceNumber ? 'Required' : ''}
          />
          <div className="flex items-end gap-2">
            <Button 
              as="button" 
              onClick={handleGet}
              disabled={isGetting}
            >
              {isGetting ? 'Getting...' : 'Get Data'}
            </Button>
            <Button 
              as="button" 
              onClick={handleSendData}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Data'}
            </Button>
          </div>
        </div>
        {(status || getStatus) && (
          <div className={`mt-2 text-sm ${(status || getStatus).includes('success') ? 'text-green-600' : 'text-text-muted'}`}>
            {status || getStatus}
          </div>
        )}
      </Card>

      {/* Customer and Date Card */}
      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Customer & Date</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Customer"
            name="customer"
            value={performanceSheet.customer}
            onChange={e => updatePerformanceSheet({ customer: e.target.value })}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={performanceSheet.date}
            onChange={e => updatePerformanceSheet({ date: e.target.value })}
          />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Material Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input label="Coil Width (in)" name="maxThick.coilWidth" value={performanceSheet.maxThick.coilWidth} onChange={handleChange} type="number" min={coilWidthMin} max={coilWidthMax} />
          <Input label="Coil Weight (Max)" name="maxThick.coilWeight" value={performanceSheet.maxThick.coilWeight} onChange={handleChange} type="number" />
          <Input label="Material Thickness (in)" name="maxThick.materialThickness" value={performanceSheet.maxThick.materialThickness} onChange={handleChange} type="number" />
          <Select label="Material Type" name="maxThick.materialType" value={performanceSheet.maxThick.materialType} onChange={handleChange} options={MATERIAL_TYPE_OPTIONS} />
          <Input label="Yield Strength (psi)" name="maxThick.yieldStrength" value={performanceSheet.maxThick.yieldStrength} onChange={handleChange} type="number" />
          <Input label="Material Tensile (psi)" name="maxThick.materialTensile" value={performanceSheet.maxThick.materialTensile} onChange={handleChange} type="number" />
          <Input label="Coil I.D." name="maxThick.coilID" value={performanceSheet.maxThick.coilID} onChange={handleChange} type="number" />
          <Input label="Coil O.D." name="maxThick.coilOD" value={performanceSheet.maxThick.coilOD} onChange={handleChange} type="number" />
          <Input label="Min Bend Radius (in)" name="maxThick.minBendRad" value={performanceSheet.maxThick.minBendRad} onChange={handleChange} type="number" />
          <Input label="Min Loop Length (ft)" name="maxThick.minLoopLength" value={performanceSheet.maxThick.minLoopLength} onChange={handleChange} type="number" />
          <Input label="Coil O.D. Calculated" name="maxThick.coilODCalculated" value={performanceSheet.maxThick.coilODCalculated} onChange={handleChange} type="number" />
        </div>
      </Card>

      <Card className="mb-0 p-4">
        <Text as="h3" className="mb-4 text-lg font-medium">Other Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Select Feed Direction"
            name="feedDirection"
            value={performanceSheet.feedDirection ?? ''}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
            error={errors.feedDirection ? 'Required' : ''}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={performanceSheet.controlsLevel ?? ''}
            onChange={handleChange}
            options={CONTROLS_LEVEL_OPTIONS}
            error={errors.controlsLevel ? 'Required' : ''}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={performanceSheet.typeOfLine ?? ''}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
            error={errors.typeOfLine ? 'Required' : ''}
          />

          <Input 
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={performanceSheet.feedControls ?? ''}
            onChange={handleChange}
            error={errors.feedControls ? 'Required' : ''}
            disabled
          />

          <Select
            label="Passline"
            name="passline"
            value={performanceSheet.passline ?? ''}
            onChange={handleChange}
            options={PASSLINE_OPTIONS}
            error={errors.passline ? 'Required' : ''}
          />
          
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={performanceSheet.typeOfRoll ?? ''}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
            error={errors.typeOfRoll ? 'Required' : ''}
          />

          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={performanceSheet.reelBackplate ?? ''}
            onChange={handleChange}
            options={REEL_BACKPLATE_OPTIONS}
            error={errors.reelBackplate ? 'Required' : ''}
          />

          <Select
            label="Reel Style"
            name="reelStyle"
            value={performanceSheet.reelStyle ?? ''}
            onChange={handleChange}
            options={REEL_STYLE_OPTIONS}
            error={errors.reelStyle ? 'Required' : ''}
          />

          <Checkbox 
            label="Light Gauge Non-Marking" 
            name="lightGauge" 
            checked={performanceSheet.lightGauge} 
            onChange={handleChange}
          />
          <Checkbox 
            label="Non-Marking" 
            name="nonMarking" 
            checked={performanceSheet.nonMarking} 
            onChange={handleChange}
          />
        </div>
      </Card>

    </div>
  );
};

export default MaterialSpecs; 