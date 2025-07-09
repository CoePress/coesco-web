import { useState } from 'react';
import { pythonInstance } from '@/utils';
import { useGetRFQ } from './use-get-rfq';

export interface RFQFormData {
  referenceNumber: string;
  date: string;
  customer: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  contactName: string;
  position: string;
  phone: string;
  email: string;
  dealerName: string;
  dealerSalesman: string;
  daysPerWeek: string;
  shiftsPerDay: string;
  lineApplication: string;
  lineType: string;
  pullThrough: string;
  coilWidthMax: string;
  coilWidthMin: string;
  maxCoilOD: string;
  coilID: string;
  coilWeightMax: string;
  coilHandlingMax: string;
  slitEdge: boolean;
  millEdge: boolean;
  coilCarRequired: string;
  runOffBackplate: string;
  requireRewinding: string;
  matSpec1: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec2: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec3: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
  matSpec4: {
    thickness: string;
    width: string;
    type: string;
    yield: string;
    tensile: string;
  };
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
}

const requiredFields = [
  "referenceNumber"
];

// Map frontend RFQFormData to backend RFQCreate model
function mapToBackendRFQ(form: RFQFormData) {
  // Helper to convert Yes/No to boolean
  const ynToBool = (val: string) => val === 'Yes' ? true : val === 'No' ? false : undefined;
  // Helper to parse float or int, fallback to undefined
  const toFloat = (val: string) => val ? parseFloat(val) : undefined;
  const toInt = (val: string) => val ? parseInt(val) : undefined;

  return {
    date: form.date || undefined,
    customer: form.customer || undefined,
    state_province: form.state || undefined,
    street_address: form.streetAddress || undefined,
    zip_code: toInt(form.zip),
    city: form.city || undefined,
    country: form.country || undefined,
    contact_name: form.contactName || undefined,
    contact_position: form.position || undefined,
    contact_phone_number: form.phone || undefined,
    contact_email: form.email || undefined,
    days_per_week_running: toInt(form.daysPerWeek),
    shifts_per_day: toInt(form.shiftsPerDay),
    line_application: form.lineApplication || undefined,
    type_of_line: form.lineType || undefined,
    pull_thru: form.pullThrough || undefined,
    coil_width_max: toFloat(form.coilWidthMax),
    coil_width_min: toFloat(form.coilWidthMin),
    max_coil_od: toFloat(form.maxCoilOD),
    coil_id: toFloat(form.coilID),
    coil_weight_max: toFloat(form.coilWeightMax),
    coil_handling_cap_max: toFloat(form.coilHandlingMax),
    coil_car: ynToBool(form.coilCarRequired),
    run_off_backplate: ynToBool(form.runOffBackplate),
    req_rewinding: ynToBool(form.requireRewinding),
    // Material specs
    max_material_thickness: toFloat(form.matSpec1.thickness),
    max_material_width: toFloat(form.matSpec1.width),
    max_material_type: form.matSpec1.type || undefined,
    max_yield_strength: toFloat(form.matSpec1.yield),
    max_tensile_strength: toFloat(form.matSpec1.tensile),
    full_material_thickness: toFloat(form.matSpec2.thickness),
    full_material_width: toFloat(form.matSpec2.width),
    full_material_type: form.matSpec2.type || undefined,
    full_yield_strength: toFloat(form.matSpec2.yield),
    full_tensile_strength: toFloat(form.matSpec2.tensile),
    min_material_thickness: toFloat(form.matSpec3.thickness),
    min_material_width: toFloat(form.matSpec3.width),
    min_material_type: form.matSpec3.type || undefined,
    min_yield_strength: toFloat(form.matSpec3.yield),
    min_tensile_strength: toFloat(form.matSpec3.tensile),
    width_material_thickness: toFloat(form.matSpec4.thickness),
    width_material_width: toFloat(form.matSpec4.width),
    width_material_type: form.matSpec4.type || undefined,
    width_yield_strength: toFloat(form.matSpec4.yield),
    width_tensile_strength: toFloat(form.matSpec4.tensile),
    cosmetic_material: ynToBool(form.cosmeticMaterial),
    brand_of_feed_equipment: form.feedEquipment || undefined,
    gap_frame_press: form.pressType.gapFrame,
    hydraulic_press: form.pressType.hydraulic,
    obi: form.pressType.obi,
    servo_press: form.pressType.servo,
    shear_die_application: form.pressType.shearDie,
    straight_side_press: form.pressType.straightSide,
    other: form.pressType.other,
    tonnage_of_press: form.tonnage || undefined,
    press_stroke_length: toFloat(form.pressStroke),
    press_max_spm: toFloat(form.maxSPM),
    press_bed_area_width: toFloat(form.pressBedWidth),
    press_bed_area_length: toFloat(form.pressBedLength),
    window_opening_size_of_press: toFloat(form.windowOpening),
    transfer_dies: form.dies.transfer,
    progressive_dies: form.dies.progressive,
    blanking_dies: form.dies.blanking,
    average_feed_length: toFloat(form.avgFeedLen),
    average_spm: toFloat(form.avgFeedSPM),
    average_fpm: toFloat((form as any).avgFPM),
    max_feed_length: toFloat(form.maxFeedLen),
    max_spm: toFloat(form.maxFeedSPM),
    max_fpm: toFloat((form as any).maxFPM),
    min_feed_length: toFloat(form.minFeedLen),
    min_spm: toFloat(form.minFeedSPM),
    min_fpm: toFloat((form as any).minFPM),
    voltage_required: toFloat(form.voltage),
    space_allocated_length: toFloat(form.spaceLength),
    space_allocated_width: toFloat(form.spaceWidth),
    obstructions: form.obstructions || undefined,
    feeder_mountable: ynToBool(form.mountToPress),
    feeder_mount_adequate_support: ynToBool(form.adequateSupport),
    custom_mounting: ynToBool(form.needMountingPlates),
    passline_height: toFloat(form.passlineHeight),
    loop_pit: ynToBool(form.loopPit),
    coil_change_time_concern: ynToBool(form.coilChangeConcern),
    coil_change_time_goal: toFloat(form.coilChangeTime),
    feed_direction: form.feedDirection || undefined,
    coil_landing: form.coilLoading || undefined,
    line_guard_safety_req: ynToBool(form.safetyRequirements),
    project_decision_date: form.decisionDate || undefined,
    ideal_delivery_date: form.idealDelivery || undefined,
    earliest_delivery_date: form.earliestDelivery || undefined,
    latest_delivery_date: form.latestDelivery || undefined,
    additional_comments: form.specialConsiderations || undefined,
    // Add more mappings as needed
  };
}

export const useCreateRFQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const { getRFQ } = useGetRFQ();

  const validate = (form: RFQFormData) => {
    const newErrors: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      if (!form[field as keyof RFQFormData]) {
        newErrors[field] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createRFQ = async (form: RFQFormData) => {
    if (!form.referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    setIsLoading(true);
    setStatus('Sending RFQ...');
    try {
      if (!validate(form)) {
        setStatus("Please fill all required fields before sending.");
        return;
      }
      // Map to backend model
      const backendData = mapToBackendRFQ(form);
      // Check if RFQ exists
      let exists = false;
      try {
        setStatus('Checking for existing RFQ...');
        const existing = await pythonInstance.get(`/rfq/${form.referenceNumber}`);
        if (existing && existing.data && existing.data.rfq) {
          exists = true;
        }
      } catch (e) {
        exists = false;
      }
      let response;
      if (exists) {
        setStatus('Updating RFQ...');
        response = await pythonInstance.put(`/rfq/${form.referenceNumber}`, backendData);
        if (response.status === 200) {
          setStatus(`RFQ updated successfully! Reference Number: ${form.referenceNumber}`);
        } else {
          setStatus("No changes were made. RFQ was not updated.");
        }
      } else {
        setStatus('Creating RFQ...');
        response = await pythonInstance.post(`/rfq/${form.referenceNumber}`, backendData);
        if (response.status === 200) {
          setStatus(`RFQ created/updated successfully! Reference Number: ${form.referenceNumber}`);
        } else {
          setStatus("No changes were made. RFQ was not created.");
        }
      }
    } catch (error: any) {
      console.error('Error creating/updating RFQ:', error);
      if (error.code === 'ECONNABORTED') {
        setStatus('Request timed out. Please check your connection and try again.');
      } else if (!error.response) {
        setStatus('Network error: Unable to connect to the server. Please check if the server is running.');
      } else if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data)
          : error.response.data;
        setStatus(`Failed to create/update RFQ: ${errorMessage}`);
      } else if (error.message) {
        setStatus(`Failed to create/update RFQ: ${error.message}`);
      } else {
        setStatus("Failed to create/update RFQ. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    errors,
    createRFQ,
    validate
  };
};

export const updateRFQ = async (referenceNumber: string, data: RFQFormData) => {
  if (!referenceNumber) return 'No reference number';
  try {
    const backendData = mapToBackendRFQ({ ...data, referenceNumber } as RFQFormData);
    await pythonInstance.put(`/rfq/${referenceNumber}`, backendData);
    return 'Saved';
  } catch (error) {
    console.error('Error updating RFQ:', error);
    return 'Failed to save';
  }
}; 