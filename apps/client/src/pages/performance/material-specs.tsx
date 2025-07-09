import { useEffect, useState, useRef } from "react";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Checkbox from "@/components/shared/checkbox";
import Text from "@/components/shared/text";
import Tabs from "@/components/shared/tabs";
import { Button, Card } from "@/components";
import { useCreateMaterialSpecs, calculateMaterialSpecs, calculateMaterialSpecsVariant } from "@/hooks/performance/use-create-material-specs";
import { useGetMaterialSpecs } from "@/hooks/performance/use-get-material-specs";
import { snakeToCamel } from "@/utils";
import { usePerformanceSheet, PerformanceSheetState } from '@/contexts/performance.context';
import { mapBackendToFrontendMaterialSpecs, mapFrontendToBackendMaterialSpecs } from '@/utils/material-specs-mapping';
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
  'Maximum Thick': 'MaximumThick',
  'Max @ Full': 'MaxAtFull',
  'Minimum Thick': 'MinimumThick',
  'Max @ Width': 'MaxAtWidth',
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
        max_coil_width: versionData.width || '',
        max_coil_weight: versionData.coilWeight || '',
        max_material_thickness: versionData.thickness || '',
        max_material_type: versionData.materialType || '',
        max_yield_strength: versionData.yieldStrength || '',
        max_tensile_strength: versionData.tensileStrength || '',
        max_fpm: '', // Add FPM field for max version
        max_min_bend_rad: versionData.minBendRad || '',
        max_min_loop_length: versionData.minLoopLength || '',
        max_coil_od: versionData.coilOD || '',
        max_coil_od_calculated: versionData.coilODCalculated || '',
        // Backward compatibility aliases
        coil_width_max: versionData.width ? Number(versionData.width) : undefined,
        coil_weight_max: form.coilWeightMax ? Number(form.coilWeightMax) : undefined,
      };
    
    case 'Max @ Full':
      return {
        ...baseData,
        full_coil_width: versionData.width || '',
        full_coil_weight: versionData.coilWeight || '',
        full_material_thickness: versionData.thickness || '',
        full_material_type: versionData.materialType || '',
        full_yield_strength: versionData.yieldStrength || '',
        full_tensile_strength: versionData.tensileStrength || '',
        full_fpm: '', // Add FPM field for full version
        full_min_bend_rad: versionData.minBendRad || '',
        full_min_loop_length: versionData.minLoopLength || '',
        full_coil_od: versionData.coilOD || '',
        full_coil_od_calculated: versionData.coilODCalculated || '',
      };
    
    case 'Minimum Thick':
      return {
        ...baseData,
        min_coil_width: versionData.width || '',
        min_coil_weight: versionData.coilWeight || '',
        min_material_thickness: versionData.thickness || '',
        min_material_type: versionData.materialType || '',
        min_yield_strength: versionData.yieldStrength || '',
        min_tensile_strength: versionData.tensileStrength || '',
        min_fpm: '', // Add FPM field for min version
        min_min_bend_rad: versionData.minBendRad || '',
        min_min_loop_length: versionData.minLoopLength || '',
        min_coil_od: versionData.coilOD || '',
        min_coil_od_calculated: versionData.coilODCalculated || '',
      };
    
    case 'Max @ Width':
      return {
        ...baseData,
        width_coil_width: versionData.width || '',
        width_coil_weight: versionData.coilWeight || '',
        width_material_thickness: versionData.thickness || '',
        width_material_type: versionData.materialType || '',
        width_yield_strength: versionData.yieldStrength || '',
        width_tensile_strength: versionData.tensileStrength || '',
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
  const { performanceSheet: form, setPerformanceSheet, updatePerformanceSheet } = usePerformanceSheet();
  const { isLoading, status, errors, createMaterialSpecs, updateMaterialSpecs } = useCreateMaterialSpecs();
  const { isLoading: isGetting, status: getStatus, fetchedMaterialSpecs, getMaterialSpecs } = useGetMaterialSpecs();
  const [version, setVersion] = useState<'Maximum Thick' | 'Max @ Full' | 'Minimum Thick' | 'Max @ Width'>('Maximum Thick');
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);

  // Get coil width boundaries from RFQ form (as numbers)
  const coilWidthMin = Number(form.coilWidthMin) || undefined;
  const coilWidthMax = Number(form.coilWidthMax) || undefined;

  useEffect(() => {
    if (fetchedMaterialSpecs) {
      // Map backend to frontend for known fields
      const mapped = mapBackendToFrontendMaterialSpecs(fetchedMaterialSpecs);
      // Mapped fields take precedence over snakeToCamel(fetchedMaterialSpecs)
      const merged = { ...snakeToCamel(fetchedMaterialSpecs), ...mapped };
      Object.keys(mapped).forEach((k) => {
        if (typeof mapped[k] === 'object' && mapped[k] !== null) {
          merged[k] = { ...((snakeToCamel((fetchedMaterialSpecs as any)[k]) || {})), ...mapped[k] };
        }
      });
      // Always preserve the user's referenceNumber in the form state
      merged.referenceNumber = form.referenceNumber || mapped.referenceNumber;
      setPerformanceSheet(merged as PerformanceSheetState);
    }
  }, [fetchedMaterialSpecs, setPerformanceSheet]);

  const currentVersionKey = versionKeyMap[version];
  const versionData = form[currentVersionKey as keyof typeof form] || {};

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
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      updatePerformanceSheet({
        [currentVersionKey]: {
          ...form[currentVersionKey],
          [name]: checked
        }
      });
    } else if (type === 'number') {
      updatePerformanceSheet({
        [currentVersionKey]: {
          ...form[currentVersionKey],
          [name]: value === '' ? undefined : parseFloat(value)
        }
      });
    } else {
      updatePerformanceSheet({
        [currentVersionKey]: {
          ...form[currentVersionKey],
          [name]: value
        }
      });
    }
  };

  const triggerCalculation = async (versionKey: string, versionData: any) => {
    let coilWeight = form.coilWeightMax !== undefined && form.coilWeightMax !== null && form.coilWeightMax !== ''
      ? Number(form.coilWeightMax)
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
          ...((form[versionKey as keyof PerformanceSheetState] as object) || {}),
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
      const versionData = form[currentVersionKey as keyof PerformanceSheetState] || {};
      if (hasAllRequiredFields(versionData)) {
        triggerCalculation(currentVersionKey, versionData);
      }
    }, 400); // Debounce to avoid rapid calls
  };

  // Send data to backend - always update/merge, whether specs exist or not
  const handleSendData = async () => {
    try {
      // Map the entire form to backend payload (all versions)
      const mapped = mapFrontendToBackendMaterialSpecs(form);
      
      if (fetchedMaterialSpecs) {
        // Update existing specs (merge with existing data)
        await updateMaterialSpecs(form.referenceNumber, mapped);
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
    const data = await getMaterialSpecs(form.referenceNumber);
  };

  return (
    <div className="max-w-[1200px] mx-auto text-sm p-6">
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Reference" 
            required
            name="referenceNumber" 
            value={form.referenceNumber} 
            onChange={e => {
              updatePerformanceSheet({ referenceNumber: e.target.value });
            }}
            error={errors.referenceNumber ? 'Required' : ''}
          />
          <div className="flex items-end gap-2">
            <Button 
              as="button" 
              onClick={handleGet}
              disabled={isGetting}
            >
              {isGetting ? 'Getting...' : 'Get Material Specs'}
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
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Customer & Date</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input
            label="Customer"
            name="customer"
            value={form.customer || ''}
            onChange={handleChange}
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={form.date || ''}
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Material Specifications</Text>
        {/* Version Tabs (inside the card) */}
        
        {/* Active Version Badge (inside the card) */}
        <Tabs activeTab={version} setActiveTab={tab => setVersion(tab as VersionKey)} tabs={VERSIONS.map(v => ({ label: v, value: v }))} />
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            version === 'Maximum Thick' ? 'bg-blue-100 text-blue-800' :
            version === 'Max @ Full' ? 'bg-green-100 text-green-800' :
            version === 'Minimum Thick' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'}`}
          >
            {version} Version
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {MATERIAL_SPECS_FIELDS[version].map((field) => {
            if (field === 'materialType') {
              return (
                <Select
                  key={field}
                  label={FIELD_LABELS[field] || field}
                  name={field}
                  value={(versionData as Record<string, any>)[field] ?? ''}
                  onChange={handleChange}
                  options={MATERIAL_TYPE_OPTIONS}
                  error={(errors as Record<string, any>)[field] ? 'Required' : ''}
                />
              );
            }
            return (
              <Input
                key={field}
                label={FIELD_LABELS[field] || field}
                name={field}
                type={field.toLowerCase().includes('thickness') || field.toLowerCase().includes('width') || field.toLowerCase().includes('coil') || field.toLowerCase().includes('weight') || field.toLowerCase().includes('strength') || field.toLowerCase().includes('fpm') || field.toLowerCase().includes('rad') || field.toLowerCase().includes('length') ? 'number' : 'text'}
                value={(versionData as Record<string, any>)[field] ?? ''}
                onChange={handleChange}
                onBlur={handleBlur}
                error={(errors as Record<string, any>)[field] ? 'Required' : ''}
                min={field === 'coilWidth' ? coilWidthMin : undefined}
                max={field === 'coilWidth' ? coilWidthMax : undefined}
              />
            );
          })}
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Other Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Select Feed Direction"
            name="feedDirection"
            value={form.feedDirection ?? ''}
            onChange={handleChange}
            options={FEED_DIRECTION_OPTIONS}
            error={errors.feedDirection ? 'Required' : ''}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={form.controlsLevel ?? ''}
            onChange={handleChange}
            options={CONTROLS_LEVEL_OPTIONS}
            error={errors.controlsLevel ? 'Required' : ''}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={form.typeOfLine ?? ''}
            onChange={handleChange}
            options={TYPE_OF_LINE_OPTIONS}
            error={errors.typeOfLine ? 'Required' : ''}
          />

          <Input 
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={form.feedControls ?? ''}
            onChange={handleChange}
            error={errors.feedControls ? 'Required' : ''}
            disabled
          />

          <Select
            label="Passline"
            name="passline"
            value={form.passline ?? ''}
            onChange={handleChange}
            options={PASSLINE_OPTIONS}
            error={errors.passline ? 'Required' : ''}
          />
          
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={form.typeOfRoll ?? ''}
            onChange={handleChange}
            options={ROLL_TYPE_OPTIONS}
            error={errors.typeOfRoll ? 'Required' : ''}
          />

          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={form.reelBackplate ?? ''}
            onChange={handleChange}
            options={REEL_BACKPLATE_OPTIONS}
            error={errors.reelBackplate ? 'Required' : ''}
          />

          <Select
            label="Reel Style"
            name="reelStyle"
            value={form.reelStyle ?? ''}
            onChange={handleChange}
            options={REEL_STYLE_OPTIONS}
            error={errors.reelStyle ? 'Required' : ''}
          />

          <Checkbox 
            label="Light Gauge Non-Marking" 
            name="lightGauge" 
            checked={form.lightGauge} 
            onChange={handleChange}
          />
          <Checkbox 
            label="Non-Marking" 
            name="nonMarking" 
            checked={form.nonMarking} 
            onChange={handleChange}
          />
        </div>
      </Card>

    </div>
  );
};

export default MaterialSpecs; 