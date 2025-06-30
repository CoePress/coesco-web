// Utility for mapping backend material specs fields to frontend form fields

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
};

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
      result[frontendKey] = backendData[backendKey];
    }
  });

  // Versioned fields
  result.MaximumThick = {};
  result.MaxAtFull = {};
  result.MinimumThick = {};
  result.MaxAtWidth = {};

  Object.entries(BACKEND_TO_FRONTEND_MAP['Maximum Thick']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      result.MaximumThick[frontendKey] = backendData[backendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Full']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      result.MaxAtFull[frontendKey] = backendData[backendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Minimum Thick']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      result.MinimumThick[frontendKey] = backendData[backendKey];
    }
  });
  Object.entries(BACKEND_TO_FRONTEND_MAP['Max @ Width']).forEach(([backendKey, frontendKey]) => {
    if (backendData[backendKey] !== undefined) {
      result.MaxAtWidth[frontendKey] = backendData[backendKey];
    }
  });

  // Set shared fields across all versions using max_ backend fields
  const sharedFields = {
    coilWeight: backendData.max_coil_weight,
    maxFPM: backendData.max_fpm,
    coilOD: backendData.max_coil_od,
    coilID: backendData.coil_id,
  };
  ['MaximumThick', 'MaxAtFull', 'MinimumThick', 'MaxAtWidth'].forEach(versionKey => {
    Object.entries(sharedFields).forEach(([frontendKey, value]) => {
      if (value !== undefined) {
        result[versionKey][frontendKey] = value;
      }
    });
  });

  if (backendData.referenceNumber) result.referenceNumber = backendData.referenceNumber;

  if (backendData.passline_height !== undefined) result.passline = backendData.passline_height;
  if (backendData.company_name !== undefined) result.customer = backendData.company_name;

  // Ensure all expected frontend fields are present with defaults
  result.passline = backendData.passline_height ?? '';
  result.customer = backendData.company_name ?? '';
  result.feedDirection = backendData.feed_direction ?? '';
  result.controlsLevel = backendData.controls_level ?? '';
  result.typeOfLine = backendData.type_of_line ?? '';
  result.feedControls = backendData.feed_controls ?? '';
  result.reelBackplate = backendData.reel_backplate ?? '';
  result.reelStyle = backendData.reel_style ?? '';
  result.lightGauge = backendData.light_guage ?? false;
  result.nonMarking = backendData.non_marking ?? false;
  result.date = backendData.date ?? '';

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
  if (form.customer !== undefined) backendData.company_name = form.customer;

  return backendData;
}

export { BACKEND_TO_FRONTEND_MAP, GENERAL_BACKEND_TO_FRONTEND }; 