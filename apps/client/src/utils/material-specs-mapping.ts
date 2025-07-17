// Utility for mapping backend material specs fields to frontend form fields

import { MATERIAL_TYPE_OPTIONS } from './select-options';
import { mapBackendToFrontend, MappingConfig } from './universal-mapping';

export const MATERIAL_SPECS_MAPPING: MappingConfig = {
  customer: 'customer',
  date: 'date',
  referenceNumber: 'referenceNumber',
  feed_direction: 'feedDirection',
  controls_level: 'controlsLevel',
  type_of_line: 'typeOfLine',
  feed_controls: 'feedControls',
  passline: 'passline',
  selected_roll: 'typeOfRoll',
  reel_backplate: 'reelBackplate',
  reel_style: 'reelStyle',
  light_guage: 'lightGauge',
  non_marking: 'nonMarking',
  coil_width_max: 'coilWidthMax',
  coil_width_min: 'coilWidthMin',
  // Add all other top-level fields from RFQ/PerformanceSheetState
  street_address: 'streetAddress',
  city: 'city',
  state_province: 'state',
  zip_code: { key: 'zip', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  country: 'country',
  contact_name: 'contactName',
  contact_position: 'position',
  contact_phone_number: 'phone',
  contact_email: 'email',
  dealer_name: 'dealerName',
  dealer_salesman: 'dealerSalesman',
  days_per_week_running: { key: 'daysPerWeek', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  shifts_per_day: { key: 'shiftsPerDay', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  line_application: 'lineApplication',
  pull_thru: { key: 'pullThrough', transform: (v) => v ? 'Yes' : 'No' },
  max_coil_od: { key: 'maxCoilOD', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  coil_id: { key: 'coilID', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  coil_weight_max: { key: 'coilWeightMax', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  coil_handling_cap_max: { key: 'coilHandlingMax', transform: (v) => v !== undefined && v !== null ? String(v) : '' },
  // Add more as needed for your full form coverage
};

// --- Versioned mapping configs ---
const MAX_THICK_MAPPING = {
  max_material_thickness: 'materialThickness',
  max_coil_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.max_material_width !== undefined && backend.max_material_width !== null ? String(backend.max_material_width) : '') },
  max_material_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.max_coil_width !== undefined && backend.max_coil_width !== null ? String(backend.max_coil_width) : '') },
  max_material_type: 'materialType',
  max_yield_strength: 'yieldStrength',
  max_tensile_strength: 'materialTensile',
  coil_id: 'coilID',
  max_coil_weight: 'coilWeight',
  max_min_bend_rad: 'minBendRad',
  max_min_loop_length: 'minLoopLength',
  max_coil_od: 'coilOD',
  max_coil_od_calculated: 'coilODCalculated',
  max_fpm: 'maxFPM',
};
const AT_FULL_MAPPING = {
  full_material_thickness: 'materialThickness',
  full_coil_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.full_material_width !== undefined && backend.full_material_width !== null ? String(backend.full_material_width) : '') },
  full_material_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.full_coil_width !== undefined && backend.full_coil_width !== null ? String(backend.full_coil_width) : '') },
  full_material_type: 'materialType',
  full_yield_strength: 'yieldStrength',
  full_tensile_strength: 'materialTensile',
  coil_id: 'coilID',
  full_coil_weight: 'coilWeight',
  full_min_bend_rad: 'minBendRad',
  full_min_loop_length: 'minLoopLength',
  full_coil_od: 'coilOD',
  full_coil_od_calculated: 'coilODCalculated',
  max_fpm: 'maxFPM',
};
const MIN_THICK_MAPPING = {
  min_material_thickness: 'materialThickness',
  min_coil_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.min_material_width !== undefined && backend.min_material_width !== null ? String(backend.min_material_width) : '') },
  min_material_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.min_coil_width !== undefined && backend.min_coil_width !== null ? String(backend.min_coil_width) : '') },
  min_material_type: 'materialType',
  min_yield_strength: 'yieldStrength',
  min_tensile_strength: 'materialTensile',
  coil_id: 'coilID',
  min_coil_weight: 'coilWeight',
  min_min_bend_rad: 'minBendRad',
  min_min_loop_length: 'minLoopLength',
  min_coil_od: 'coilOD',
  min_coil_od_calculated: 'coilODCalculated',
  max_fpm: 'maxFPM',
};
const AT_WIDTH_MAPPING = {
  width_material_thickness: 'materialThickness',
  width_coil_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.width_material_width !== undefined && backend.width_material_width !== null ? String(backend.width_material_width) : '') },
  width_material_width: { key: 'coilWidth', transform: (v: any, backend: any) => v !== undefined && v !== null ? String(v) : (backend.width_coil_width !== undefined && backend.width_coil_width !== null ? String(backend.width_coil_width) : '') },
  width_material_type: 'materialType',
  width_yield_strength: 'yieldStrength',
  width_tensile_strength: 'materialTensile',
  coil_id: 'coilID',
  width_coil_weight: 'coilWeight',
  width_min_bend_rad: 'minBendRad',
  width_min_loop_length: 'minLoopLength',
  width_coil_od: 'coilOD',
  width_coil_od_calculated: 'coilODCalculated',
  max_fpm: 'maxFPM',
};

export function mapBackendToFrontendMaterialSpecsUniversal(backend: any) {
  // Map versioned fields
  const versioned = {
    maxThick: mapBackendToFrontend(backend, MAX_THICK_MAPPING),
    atFull: mapBackendToFrontend(backend, AT_FULL_MAPPING),
    minThick: mapBackendToFrontend(backend, MIN_THICK_MAPPING),
    atWidth: mapBackendToFrontend(backend, AT_WIDTH_MAPPING),
  };
  // Map top-level fields (Other Specifications)
  const topLevel = mapBackendToFrontend(backend, MATERIAL_SPECS_MAPPING);
    return {
    ...versioned,
    ...topLevel,
  };
}

/**
 * Transforms frontend material specs data to the backend format.
 * @param form The frontend form data object
 * @returns The mapped backend data object
 */
export function mapFrontendToBackendMaterialSpecs(form: any): any {
  const backendData: any = {};

  // General fields
  Object.entries(MATERIAL_SPECS_MAPPING).forEach(([backendKey, frontendKey]) => {
    if (form[frontendKey] !== undefined) {
      backendData[backendKey] = form[frontendKey];
    }
  });

  // Company name sync: set customer from customer
  if (form.customer !== undefined) {
    backendData.customer = form.customer;
  }

  // Versioned fields
  // These fields are not directly mapped from the form to backendData
  // as they are handled by the universal mapping utility.
  // The universal mapping utility will handle the versioned fields
  // and their nested structures within the backendData object.

  // Shared fields
  if (form.MaximumThick && form.MaximumThick.coilWeight !== undefined) backendData.max_coil_weight = form.MaximumThick.coilWeight;
  if (form.MaximumThick && form.MaximumThick.maxFPM !== undefined) backendData.max_fpm = form.MaximumThick.maxFPM;
  if (form.MaximumThick && form.MaximumThick.coilOD !== undefined) backendData.max_coil_od = form.MaximumThick.coilOD;
  if (form.MaximumThick && form.MaximumThick.coilID !== undefined) backendData.max_coil_id = form.MaximumThick.coilID;

  if (form.MaxAtFull && form.MaxAtFull.coilWeight !== undefined) backendData.full_coil_weight = form.MaxAtFull.coilWeight;
  if (form.MaxAtFull && form.MaxAtFull.maxFPM !== undefined) backendData.full_fpm = form.MaxAtFull.maxFPM;
  if (form.MaxAtFull && form.MaxAtFull.coilOD !== undefined) backendData.full_coil_od = form.MaxAtFull.coilOD;
  if (form.MaxAtFull && form.MaxAtFull.coilID !== undefined) backendData.full_coil_id = form.MaxAtFull.coilID;

  if (form.MinimumThick && form.MinimumThick.coilWeight !== undefined) backendData.min_coil_weight = form.MinimumThick.coilWeight;
  if (form.MinimumThick && form.MinimumThick.maxFPM !== undefined) backendData.min_fpm = form.MinimumThick.maxFPM;
  if (form.MinimumThick && form.MinimumThick.coilOD !== undefined) backendData.min_coil_od = form.MinimumThick.coilOD;
  if (form.MinimumThick && form.MinimumThick.coilID !== undefined) backendData.min_coil_id = form.MinimumThick.coilID;

  if (form.MaxAtWidth && form.MaxAtWidth.coilWeight !== undefined) backendData.width_coil_weight = form.MaxAtWidth.coilWeight;
  if (form.MaxAtWidth && form.MaxAtWidth.maxFPM !== undefined) backendData.width_fpm = form.MaxAtWidth.maxFPM;
  if (form.MaxAtWidth && form.MaxAtWidth.coilOD !== undefined) backendData.width_coil_od = form.MaxAtWidth.coilOD;
  if (form.MaxAtWidth && form.MaxAtWidth.coilID !== undefined) backendData.width_coil_id = form.MaxAtWidth.coilID;

  if (form.referenceNumber !== undefined) backendData.referenceNumber = form.referenceNumber;

  // Explicit mappings for passline and customer
  if (form.passline !== undefined) backendData.passline_height = form.passline;
  if (form.customer !== undefined) backendData.customer = form.customer;

  // --- MATERIAL TYPE: value to label mapping for backend ---
  if (form.MaximumThick && form.MaximumThick.materialType) {
    backendData.max_material_type = MATERIAL_TYPE_VALUE_TO_LABEL[form.MaximumThick.materialType] ?? form.MaximumThick.materialType;
  }
  if (form.MaxAtFull && form.MaxAtFull.materialType) {
    backendData.full_material_type = MATERIAL_TYPE_VALUE_TO_LABEL[form.MaxAtFull.materialType] ?? form.MaxAtFull.materialType;
  }
  if (form.MinimumThick && form.MinimumThick.materialType) {
    backendData.min_material_type = MATERIAL_TYPE_VALUE_TO_LABEL[form.MinimumThick.materialType] ?? form.MinimumThick.materialType;
  }
  if (form.MaxAtWidth && form.MaxAtWidth.materialType) {
    backendData.width_material_type = MATERIAL_TYPE_VALUE_TO_LABEL[form.MaxAtWidth.materialType] ?? form.MaxAtWidth.materialType;
  }

  // In mapFrontendToBackendMaterialSpecs, add explicit mapping for coilWidthMax and coilWidthMin
  if (form.coilWidthMax !== undefined) backendData.coil_width_max = form.coilWidthMax;
  if (form.coilWidthMin !== undefined) backendData.coil_width_min = form.coilWidthMin;

  return backendData;
}

// Type for the backend payload
export interface MaterialSpecsCreatePayload {
  customer?: string;
  date?: string;
  max_coil_width?: number | string;
  max_coil_weight?: string;
  max_material_thickness?: number | string;
  max_material_type?: string;
  max_yield_strength?: number | string;
  max_tensile_strength?: number | string;
  full_coil_width?: number | string;
  full_coil_weight?: number | string;
  full_material_thickness?: number | string;
  full_material_type?: string;
  full_yield_strength?: number | string;
  full_tensile_strength?: number | string;
  min_coil_width?: number | string;
  min_coil_weight?: number | string;
  min_material_thickness?: number | string;
  min_material_type?: string;
  min_yield_strength?: number | string;
  min_tensile_strength?: number | string;
  width_coil_width?: number | string;
  width_coil_weight?: number | string;
  width_material_thickness?: number | string;
  width_material_type?: string;
  width_yield_strength?: number | string;
  width_tensile_strength?: number | string;
  coil_id?: string;
  feed_direction?: string;
  controls_level?: string;
  type_of_line?: string;
  feed_controls?: string;
  passline?: string;
  selected_roll?: string;
  reel_backplate?: string;
  reel_style?: string;
  light_guage?: boolean;
  non_marking?: boolean;
  // Add other fields as needed
}

// Mapping function for TypeScript projects
export function mapMaterialSpecsToBackend(form: any): MaterialSpecsCreatePayload {
  return {
    customer: form.customer,
    date: form.date,
    // --- maxThick (was matSpec1) ---
    max_coil_width: form.maxThick.width,
    max_coil_weight: form.coilWeight,
    max_material_thickness: form.maxThick.thickness,
    max_material_type: form.maxThick.type,
    max_yield_strength: form.maxThick.yield,
    max_tensile_strength: form.maxThick.tensile,
    // --- atFull (was matSpec2) ---
    full_coil_width: form.atFull.width,
    full_coil_weight: form.coilWeight,
    full_material_thickness: form.atFull.thickness,
    full_material_type: form.atFull.type,
    full_yield_strength: form.atFull.yield,
    full_tensile_strength: form.atFull.tensile,
    // --- minThick (was matSpec3) ---
    min_coil_width: form.minThick.width,
    min_coil_weight: form.coilWeight,
    min_material_thickness: form.minThick.thickness,
    min_material_type: form.minThick.type,
    min_yield_strength: form.minThick.yield,
    min_tensile_strength: form.minThick.tensile,
    // --- atWidth (was matSpec4) ---
    width_coil_width: form.atWidth.width,
    width_coil_weight: form.coilWeight,
    width_material_thickness: form.atWidth.thickness,
    width_material_type: form.atWidth.type,
    width_yield_strength: form.atWidth.yield,
    width_tensile_strength: form.atWidth.tensile,
    // --- Shared fields ---
    coil_id: form.coilID,
    feed_direction: form.feedDirection,
    controls_level: form.controlsLevel,
    type_of_line: form.typeOfLine,
    feed_controls: form.feedControls,
    passline: form.passline,
    selected_roll: form.typeOfRoll,
    reel_backplate: form.reelBackplate,
    reel_style: form.reelStyle,
    light_guage: form.lightGauge,
    non_marking: form.nonMarking,
  };
}

// --- MATERIAL TYPE MAPPING ---
const MATERIAL_TYPE_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map(opt => [opt.label, opt.value])
);
const MATERIAL_TYPE_VALUE_TO_LABEL: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map(opt => [opt.value, opt.label])
);

export { MATERIAL_TYPE_OPTIONS, MATERIAL_TYPE_LABEL_TO_VALUE, MATERIAL_TYPE_VALUE_TO_LABEL }; 