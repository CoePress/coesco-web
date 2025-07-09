// Utility for mapping backend material specs fields to frontend form fields

import { MATERIAL_TYPE_OPTIONS } from './select-options';

const BACKEND_TO_FRONTEND_MAP = {
  'Maximum Thick': {
    max_material_width: 'coilWidth',
    max_coil_weight: 'coilWeight',
    max_material_thickness: 'materialThickness',
    max_material_type: 'materialType',
    max_yield_strength: 'yieldStrength',
    max_tensile_strength: 'materialTensile',
    max_fpm: 'maxFPM',
    max_min_bend_rad: 'minBendRad',
    max_min_loop_length: 'minLoopLength',
    max_coil_od: 'coilOD',
    max_coil_id: 'coilID',
    max_coil_od_calculated: 'coilODCalculated',
  },
  'Max @ Full': {
    full_material_width: 'coilWidth',
    full_coil_weight: 'coilWeight',
    full_material_thickness: 'materialThickness',
    full_material_type: 'materialType',
    full_yield_strength: 'yieldStrength',
    full_tensile_strength: 'materialTensile',
    full_fpm: 'maxFPM',
    full_min_bend_rad: 'minBendRad',
    full_min_loop_length: 'minLoopLength',
    full_coil_od: 'coilOD',
    full_coil_id: 'coilID',
    full_coil_od_calculated: 'coilODCalculated',
  },
  'Minimum Thick': {
    min_material_width: 'coilWidth',
    min_coil_weight: 'coilWeight',
    min_material_thickness: 'materialThickness',
    min_material_type: 'materialType',
    min_yield_strength: 'yieldStrength',
    min_tensile_strength: 'materialTensile',
    min_fpm: 'maxFPM',
    min_min_bend_rad: 'minBendRad',
    min_min_loop_length: 'minLoopLength',
    min_coil_od: 'coilOD',
    min_coil_id: 'coilID',
    min_coil_od_calculated: 'coilODCalculated',
  },
  'Max @ Width': {
    width_material_width: 'coilWidth',
    width_coil_weight: 'coilWeight',
    width_material_thickness: 'materialThickness',
    width_material_type: 'materialType',
    width_yield_strength: 'yieldStrength',
    width_tensile_strength: 'materialTensile',
    width_fpm: 'maxFPM',
    width_min_bend_rad: 'minBendRad',
    width_min_loop_length: 'minLoopLength',
    width_coil_od: 'coilOD',
    width_coil_id: 'coilID',
    width_coil_od_calculated: 'coilODCalculated',
  }
};

const GENERAL_BACKEND_TO_FRONTEND = {
  customer: 'customer',
  date: 'date',
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
};

// --- MATERIAL TYPE MAPPING ---
const MATERIAL_TYPE_LABEL_TO_VALUE: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map(opt => [opt.label, opt.value])
);
const MATERIAL_TYPE_VALUE_TO_LABEL: Record<string, string> = Object.fromEntries(
  MATERIAL_TYPE_OPTIONS.map(opt => [opt.value, opt.label])
);

/**
 * Transforms backend material specs data to the frontend form structure.
 * @param backendData The data object from the backend
 * @returns The mapped frontend data object
 */
export function mapBackendToFrontendMaterialSpecs(backendData: any): any {
  const result: any = {};

  // General fields
  Object.entries(GENERAL_BACKEND_TO_FRONTEND).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      const value = backendData[backendKey];
      result[frontendKey] = value === null ? '' : value;
    }
  });

  // Versioned fields
  result.MaximumThick = {};
  result.MaxAtFull = {};
  result.MinimumThick = {};
  result.MaxAtWidth = {};

  Object.entries(BACKEND_TO_FRONTEND_MAP['Maximum Thick']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      let value = backendData[backendKey];
      if (frontendKey === 'materialType') {
        // Map label to value for materialType
        value = value === null ? '' : value;
        result.MaximumThick[frontendKey] = MATERIAL_TYPE_LABEL_TO_VALUE[value] ?? value;
      } else {
        result.MaximumThick[frontendKey] = value === null ? '' : value;
      }
    } else {
      result.MaximumThick[frontendKey] = '';
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Full']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      let value = backendData[backendKey];
      if (frontendKey === 'materialType') {
        value = value === null ? '' : value;
        result.MaxAtFull[frontendKey] = MATERIAL_TYPE_LABEL_TO_VALUE[value] ?? value;
      } else {
        result.MaxAtFull[frontendKey] = value === null ? '' : value;
      }
    } else {
      result.MaxAtFull[frontendKey] = '';
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Minimum Thick']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      let value = backendData[backendKey];
      if (frontendKey === 'materialType') {
        value = value === null ? '' : value;
        result.MinimumThick[frontendKey] = MATERIAL_TYPE_LABEL_TO_VALUE[value] ?? value;
      } else {
        result.MinimumThick[frontendKey] = value === null ? '' : value;
      }
    } else {
      result.MinimumThick[frontendKey] = '';
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Width']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      let value = backendData[backendKey];
      if (frontendKey === 'materialType') {
        value = value === null ? '' : value;
        result.MaxAtWidth[frontendKey] = MATERIAL_TYPE_LABEL_TO_VALUE[value] ?? value;
      } else {
        result.MaxAtWidth[frontendKey] = value === null ? '' : value;
      }
    } else {
      result.MaxAtWidth[frontendKey] = '';
    }
  });

  // --- NEW: Map calculated fields for all versions ---
  const calculatedFieldMap = [
    { version: 'MaximumThick', prefix: 'max' },
    { version: 'MaxAtFull', prefix: 'full' },
    { version: 'MinimumThick', prefix: 'min' },
    { version: 'MaxAtWidth', prefix: 'width' },
  ];
  calculatedFieldMap.forEach(({ version, prefix }) => {
    // min_bend_rad -> minBendRad
    if (backendData[`${prefix}_min_bend_rad`] !== undefined) {
      result[version].minBendRad = backendData[`${prefix}_min_bend_rad`];
    }
    // min_loop_length -> minLoopLength
    if (backendData[`${prefix}_min_loop_length`] !== undefined) {
      result[version].minLoopLength = backendData[`${prefix}_min_loop_length`];
    }
    // coil_od_calculated -> coilODCalculated
    if (backendData[`${prefix}_coil_od_calculated`] !== undefined) {
      result[version].coilODCalculated = backendData[`${prefix}_coil_od_calculated`];
    }
  });

  if (backendData.referenceNumber) result.referenceNumber = backendData.referenceNumber;

  if (backendData.passline_height !== undefined) result.passline = backendData.passline_height;
  if (backendData.customer !== undefined) result.customer = backendData.customer;

  // Ensure all expected frontend fields are present with defaults
  result.passline = backendData.passline_height ?? '';
  result.customer = backendData.customer ?? '';
  result.feedDirection = backendData.feed_direction ?? '';
  result.controlsLevel = backendData.controls_level ?? '';
  result.typeOfLine = backendData.type_of_line ?? '';
  result.feedControls = backendData.feed_controls ?? '';
  result.reelBackplate = backendData.reel_backplate ?? '';
  result.reelStyle = backendData.reel_style ?? '';
  result.lightGauge = backendData.light_guage ?? false;
  result.nonMarking = backendData.non_marking ?? false;
  result.date = backendData.date ?? '';

  // Ensure top-level coilWidthMax and coilWidthMin are set
  result.coilWidthMax = backendData.coil_width_max === null || backendData.coil_width_max === undefined ? '' : backendData.coil_width_max;
  result.coilWidthMin = backendData.coil_width_min === null || backendData.coil_width_min === undefined ? '' : backendData.coil_width_min;

  return result;
}

/**
 * Transforms frontend material specs data to the backend format.
 * @param form The frontend form data object
 * @returns The mapped backend data object
 */
export function mapFrontendToBackendMaterialSpecs(form: any): any {
  const backendData: any = {};

  // General fields
  Object.entries(GENERAL_BACKEND_TO_FRONTEND).forEach(([backendKey, frontendKey]) => {
    if (form[frontendKey] !== undefined) {
      backendData[backendKey] = form[frontendKey];
    }
  });

  // Company name sync: set customer from customer
  if (form.customer !== undefined) {
    backendData.customer = form.customer;
  }

  // Versioned fields
  Object.entries(BACKEND_TO_FRONTEND_MAP['Maximum Thick']).forEach(([backendKey, frontendKey]) => {
    if (form.MaximumThick && form.MaximumThick[frontendKey] !== undefined) {
      backendData[backendKey] = form.MaximumThick[frontendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Full']).forEach(([backendKey, frontendKey]) => {
    if (form.MaxAtFull && form.MaxAtFull[frontendKey] !== undefined) {
      backendData[backendKey] = form.MaxAtFull[frontendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Minimum Thick']).forEach(([backendKey, frontendKey]) => {
    if (form.MinimumThick && form.MinimumThick[frontendKey] !== undefined) {
      backendData[backendKey] = form.MinimumThick[frontendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Width']).forEach(([backendKey, frontendKey]) => {
    if (form.MaxAtWidth && form.MaxAtWidth[frontendKey] !== undefined) {
      backendData[backendKey] = form.MaxAtWidth[frontendKey];
    }
  });

  // Shared fields
  if (form.MaximumThick && form.MaximumThick.coilWeight !== undefined) backendData.max_coil_weight = form.MaximumThick.coilWeight;
  if (form.MaximumThick && form.MaximumThick.maxFPM !== undefined) backendData.max_fpm = form.MaximumThick.maxFPM;
  if (form.MaximumThick && form.MaximumThick.coilOD !== undefined) backendData.max_coil_od = form.MaximumThick.coilOD;
  if (form.MaximumThick && form.MaximumThick.coilID !== undefined) backendData.coil_id = form.MaximumThick.coilID;

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
    // --- MaximumThick (matSpec1) ---
    max_coil_width: form.matSpec1.width,
    max_coil_weight: form.coilWeight,
    max_material_thickness: form.matSpec1.thickness,
    max_material_type: form.matSpec1.type,
    max_yield_strength: form.matSpec1.yield,
    max_tensile_strength: form.matSpec1.tensile,
    // --- MaxAtFull (matSpec2) ---
    full_coil_width: form.matSpec2.width,
    full_coil_weight: form.coilWeight,
    full_material_thickness: form.matSpec2.thickness,
    full_material_type: form.matSpec2.type,
    full_yield_strength: form.matSpec2.yield,
    full_tensile_strength: form.matSpec2.tensile,
    // --- MinimumThick (matSpec3) ---
    min_coil_width: form.matSpec3.width,
    min_coil_weight: form.coilWeight,
    min_material_thickness: form.matSpec3.thickness,
    min_material_type: form.matSpec3.type,
    min_yield_strength: form.matSpec3.yield,
    min_tensile_strength: form.matSpec3.tensile,
    // --- MaxAtWidth (matSpec4) ---
    width_coil_width: form.matSpec4.width,
    width_coil_weight: form.coilWeight,
    width_material_thickness: form.matSpec4.thickness,
    width_material_type: form.matSpec4.type,
    width_yield_strength: form.matSpec4.yield,
    width_tensile_strength: form.matSpec4.tensile,
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

export { BACKEND_TO_FRONTEND_MAP, GENERAL_BACKEND_TO_FRONTEND }; 