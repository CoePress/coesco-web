import { useState, useEffect } from "react";
import { Button } from "@/components";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Checkbox from "@/components/shared/checkbox";
import Textarea from "@/components/shared/textarea";
import Text from "@/components/shared/text";
import Card from "@/components/shared/card";
import { useCreateRFQ, RFQFormData, updateRFQ } from "@/hooks/performance/use-create-rfq";
import { useGetRFQ } from "@/hooks/performance/use-get-rfq";
import { pythonInstance } from "@/utils";

const initialState: RFQFormData & { avgFPM?: string; maxFPM?: string; minFPM?: string } = {
  referenceNumber: "",
  date: "",
  companyName: "",
  streetAddress: "",
  city: "",
  state: "",
  zip: "",
  country: "",
  contactName: "",
  position: "",
  phone: "",
  email: "",
  dealerName: "",
  dealerSalesman: "",
  daysPerWeek: "",
  shiftsPerDay: "",
  lineApplication: "Press Feed",
  lineType: "Conventional",
  pullThrough: "No",
  coilWidthMax: "",
  coilWidthMin: "",
  maxCoilOD: "",
  coilID: "",
  coilWeightMax: "",
  coilHandlingMax: "",
  slitEdge: false,
  millEdge: false,
  coilCarRequired: "No",
  runOffBackplate: "No",
  requireRewinding: "No",
  matSpec1: {thickness: "", width: "", type: "", yield: "", tensile: ""},
  matSpec2: {thickness: "", width: "", type: "", yield: "", tensile: ""},
  matSpec3: {thickness: "", width: "", type: "", yield: "", tensile: ""},
  matSpec4: {thickness: "", width: "", type: "", yield: "", tensile: ""},
  cosmeticMaterial: "No",
  feedEquipment: "",
  pressType: {
    gapFrame: false,
    hydraulic: false,
    obi: false,
    servo: false,
    shearDie: false,
    straightSide: false,
    other: false,
    otherText: "",
  },
  tonnage: "",
  pressBedWidth: "",
  pressBedLength: "",
  pressStroke: "",
  windowOpening: "",
  maxSPM: "",
  dies: {
    transfer: false,
    progressive: false,
    blanking: false,
  },
  avgFeedLen: "",
  avgFeedSPM: "",
  maxFeedLen: "",
  maxFeedSPM: "",
  minFeedLen: "",
  minFeedSPM: "",
  voltage: "",
  spaceLength: "",
  spaceWidth: "",
  obstructions: "",
  mountToPress: "",
  adequateSupport: "",
  requireCabinet: "",
  needMountingPlates: "",
  passlineHeight: "",
  loopPit: "",
  coilChangeConcern: "",
  coilChangeTime: "",
  downtimeReasons: "",
  feedDirection: "",
  coilLoading: "",
  safetyRequirements: "",
  decisionDate: "",
  idealDelivery: "",
  earliestDelivery: "",
  latestDelivery: "",
  specialConsiderations: "",
  avgFPM: "",
  maxFPM: "",
  minFPM: "",
};


// Map backend RFQ data to frontend form state
function mapBackendToFrontendRFQ(data: any): typeof initialState {
  return {
    referenceNumber: data.reference || '',
    date: data.date || '',
    companyName: data.company_name || '',
    streetAddress: data.street_address || '',
    city: data.city || '',
    state: data.state_province || '',
    zip: data.zip_code !== undefined && data.zip_code !== null ? String(data.zip_code) : '',
    country: data.country || '',
    contactName: data.contact_name || '',
    position: data.contact_position || '',
    phone: data.contact_phone_number || '',
    email: data.contact_email || '',
    dealerName: data.dealer_name || '',
    dealerSalesman: data.dealer_salesman || '',
    daysPerWeek: data.days_per_week_running !== undefined && data.days_per_week_running !== null ? String(data.days_per_week_running) : '',
    shiftsPerDay: data.shifts_per_day !== undefined && data.shifts_per_day !== null ? String(data.shifts_per_day) : '',
    lineApplication: data.line_application || '',
    lineType: data.type_of_line || '',
    pullThrough: data.pull_thru || '',
    coilWidthMax: data.coil_width_max !== undefined && data.coil_width_max !== null ? String(data.max_coil_width) : '',
    coilWidthMin: data.coil_width_min !== undefined && data.coil_width_min !== null ? String(data.min_coil_width) : '',
    maxCoilOD: data.max_coil_od !== undefined && data.max_coil_od !== null ? String(data.max_coil_od) : '',
    coilID: data.coil_id !== undefined && data.coil_id !== null ? String(data.coil_id) : '',
    coilWeightMax: data.coil_weight_max !== undefined && data.coil_weight_max !== null ? String(data.max_coil_weight) : '',
    coilHandlingMax: data.coil_handling_cap_max !== undefined && data.coil_handling_cap_max !== null ? String(data.max_coil_handling_cap) : '',
    slitEdge: false, // Not present in backend, default to false
    millEdge: false, // Not present in backend, default to false
    coilCarRequired: data.coil_car === true ? 'Yes' : data.coil_car === false ? 'No' : '',
    runOffBackplate: data.run_off_backplate === true ? 'Yes' : data.run_off_backplate === false ? 'No' : '',
    requireRewinding: data.req_rewinding === true ? 'Yes' : data.req_rewinding === false ? 'No' : '',
    matSpec1: {
      thickness: data.max_material_thickness !== undefined && data.max_material_thickness !== null ? String(data.max_material_thickness) : '',
      width: data.max_material_width !== undefined && data.max_material_width !== null ? String(data.max_material_width) : '',
      type: data.max_material_type || '',
      yield: data.max_yield_strength !== undefined && data.max_yield_strength !== null ? String(data.max_yield_strength) : '',
      tensile: data.max_tensile_strength !== undefined && data.max_tensile_strength !== null ? String(data.max_tensile_strength) : '',
    },
    matSpec2: {
      thickness: data.full_material_thickness !== undefined && data.full_material_thickness !== null ? String(data.full_material_thickness) : '',
      width: data.full_material_width !== undefined && data.full_material_width !== null ? String(data.full_material_width) : '',
      type: data.full_material_type || '',
      yield: data.full_yield_strength !== undefined && data.full_yield_strength !== null ? String(data.full_yield_strength) : '',
      tensile: data.full_tensile_strength !== undefined && data.full_tensile_strength !== null ? String(data.full_tensile_strength) : '',
    },
    matSpec3: {
      thickness: data.min_material_thickness !== undefined && data.min_material_thickness !== null ? String(data.min_material_thickness) : '',
      width: data.min_material_width !== undefined && data.min_material_width !== null ? String(data.min_material_width) : '',
      type: data.min_material_type || '',
      yield: data.min_yield_strength !== undefined && data.min_yield_strength !== null ? String(data.min_yield_strength) : '',
      tensile: data.min_tensile_strength !== undefined && data.min_tensile_strength !== null ? String(data.min_tensile_strength) : '',
    },
    matSpec4: {
      thickness: data.width_material_thickness !== undefined && data.width_material_thickness !== null ? String(data.width_material_thickness) : '',
      width: data.width_material_width !== undefined && data.width_material_width !== null ? String(data.width_material_width) : '',
      type: data.width_material_type || '',
      yield: data.width_yield_strength !== undefined && data.width_yield_strength !== null ? String(data.width_yield_strength) : '',
      tensile: data.width_tensile_strength !== undefined && data.width_tensile_strength !== null ? String(data.width_tensile_strength) : '',
    },
    cosmeticMaterial: data.cosmetic_material === true ? 'Yes' : data.cosmetic_material === false ? 'No' : '',
    feedEquipment: data.brand_of_feed_equipment || '',
    pressType: {
      gapFrame: !!data.gap_frame_press,
      hydraulic: !!data.hydraulic_press,
      obi: !!data.obi,
      servo: !!data.servo_press,
      shearDie: !!data.shear_die_application,
      straightSide: !!data.straight_side_press,
      other: !!data.other,
      otherText: '', // Not present in backend
    },
    tonnage: data.tonnage_of_press !== undefined && data.tonnage_of_press !== null ? String(data.tonnage_of_press) : '',
    pressBedWidth: data.press_bed_area_width !== undefined && data.press_bed_area_width !== null ? String(data.press_bed_area_width) : '',
    pressBedLength: data.press_bed_area_length !== undefined && data.press_bed_area_length !== null ? String(data.press_bed_area_length) : '',
    pressStroke: data.press_stroke_length !== undefined && data.press_stroke_length !== null ? String(data.press_stroke_length) : '',
    windowOpening: data.window_opening_size_of_press !== undefined && data.window_opening_size_of_press !== null ? String(data.window_opening_size_of_press) : '',
    maxSPM: data.press_max_spm !== undefined && data.press_max_spm !== null ? String(data.press_max_spm) : '',
    dies: {
      transfer: !!data.transfer_dies,
      progressive: !!data.progressive_dies,
      blanking: !!data.blanking_dies,
    },
    avgFeedLen: data.average_feed_length !== undefined && data.average_feed_length !== null ? String(data.average_feed_length) : '',
    avgFeedSPM: data.average_spm !== undefined && data.average_spm !== null ? String(data.average_spm) : '',
    avgFPM: data.average_fpm !== undefined && data.average_fpm !== null ? String(data.average_fpm) : '',
    maxFeedLen: data.max_feed_length !== undefined && data.max_feed_length !== null ? String(data.max_feed_length) : '',
    maxFeedSPM: data.max_spm !== undefined && data.max_spm !== null ? String(data.max_spm) : '',
    maxFPM: data.max_fpm !== undefined && data.max_fpm !== null ? String(data.max_fpm) : '',
    minFeedLen: data.min_feed_length !== undefined && data.min_feed_length !== null ? String(data.min_feed_length) : '',
    minFeedSPM: data.min_spm !== undefined && data.min_spm !== null ? String(data.min_spm) : '',
    minFPM: data.min_fpm !== undefined && data.min_fpm !== null ? String(data.min_fpm) : '',
    voltage: data.voltage_required !== undefined && data.voltage_required !== null ? String(data.voltage_required) : '',
    spaceLength: data.space_allocated_length !== undefined && data.space_allocated_length !== null ? String(data.space_allocated_length) : '',
    spaceWidth: data.space_allocated_width !== undefined && data.space_allocated_width !== null ? String(data.space_allocated_width) : '',
    obstructions: data.obstructions || '',
    mountToPress: data.feeder_mountable === true ? 'Yes' : data.feeder_mountable === false ? 'No' : '',
    adequateSupport: data.feeder_mount_adequate_support === true ? 'Yes' : data.feeder_mount_adequate_support === false ? 'No' : '',
    requireCabinet: '', // Not present in backend
    needMountingPlates: data.custom_mounting === true ? 'Yes' : data.custom_mounting === false ? 'No' : '',
    passlineHeight: data.passline_height !== undefined && data.passline_height !== null ? String(data.passline_height) : '',
    loopPit: data.loop_pit === true ? 'Yes' : data.loop_pit === false ? 'No' : '',
    coilChangeConcern: data.coil_change_time_concern === true ? 'Yes' : data.coil_change_time_concern === false ? 'No' : '',
    coilChangeTime: data.coil_change_time_goal !== undefined && data.coil_change_time_goal !== null ? String(data.coil_change_time_goal) : '',
    downtimeReasons: '', // Not present in backend
    feedDirection: data.feed_direction || '',
    coilLoading: data.coil_landing || '',
    safetyRequirements: data.line_guard_safety_req === true ? 'Yes' : data.line_guard_safety_req === false ? 'No' : '',
    decisionDate: data.project_decision_date || '',
    idealDelivery: data.ideal_delivery_date || '',
    earliestDelivery: data.earliest_delivery_date || '',
    latestDelivery: data.latest_delivery_date || '',
    specialConsiderations: data.additional_comments || '',
  };
}

const RFQ = () => {
  const [form, setForm] = useState<typeof initialState>(initialState);
  const { isLoading, status, errors, createRFQ } = useCreateRFQ();
  const { isLoading: isGetting, status: getStatus, fetchedRFQ, getRFQ } = useGetRFQ();
  const [saveStatus, setSaveStatus] = useState('');

  useEffect(() => {
    localStorage.setItem('rfqFormData', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (fetchedRFQ) {
      const data = (typeof fetchedRFQ === 'object' && 'rfq' in fetchedRFQ && fetchedRFQ.rfq)
        ? (fetchedRFQ as any).rfq
        : fetchedRFQ;
      setForm(mapBackendToFrontendRFQ(data));
    }
  }, [fetchedRFQ]);

  useEffect(() => {
    const ref = localStorage.getItem('currentReferenceNumber') || '';
    if (ref && ref !== form.referenceNumber) {
      setForm(prev => ({ ...prev, referenceNumber: ref || '' }));
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'currentReferenceNumber' && e.newValue && e.newValue !== form.referenceNumber) {
        setForm(prev => ({ ...prev, referenceNumber: e.newValue || '' }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [form.referenceNumber]);

  const fetchFPM = async (feed_length: string, spm: string, key: 'avgFPM' | 'maxFPM' | 'minFPM') => {
    const length = parseFloat(feed_length);
    const spmVal = parseFloat(spm);
    if (!length || !spmVal) {
      setForm((prev) => ({ ...prev, [key]: "" }));
      return;
    }
    try {
      const res = await pythonInstance.post("/rfq/calculate_fpm", { feed_length: length, spm: spmVal });
      setForm((prev) => ({ ...prev, [key]: res.data.fpm?.toString() ?? "" }));
    } catch {
      setForm((prev) => ({ ...prev, [key]: "" }));
    }
  };

  useEffect(() => {
    fetchFPM(form.avgFeedLen, form.avgFeedSPM, 'avgFPM');
  }, [form.avgFeedLen, form.avgFeedSPM]);
  useEffect(() => {
    fetchFPM(form.maxFeedLen, form.maxFeedSPM, 'maxFPM');
  }, [form.maxFeedLen, form.maxFeedSPM]);
  useEffect(() => {
    fetchFPM(form.minFeedLen, form.minFeedSPM, 'minFPM');
  }, [form.minFeedLen, form.minFeedSPM]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("pressType.")) {
      setForm((prev) => ({
        ...prev,
        pressType: {
          ...prev.pressType,
          [name.split(".")[1]]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.includes("dies.")) {
      setForm((prev) => ({
        ...prev,
        dies: {
          ...prev.dies,
          [name.split(".")[1]]: checked,
        },
      }));
    } else if (name.startsWith("matSpec")) {
      const [spec, field] = name.split(".");
      setForm((prev) => ({
        ...prev,
        [spec]: {
          ...(prev[spec as keyof RFQFormData] as { [key: string]: string }),
          [field]: value,
        },
      }));
    } else {
      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    await createRFQ(form);
  };

  const handleGet = async () => {
    await getRFQ(form.referenceNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto text-sm p-6">
      {saveStatus && <div className={`text-xs ${saveStatus === 'Saved' ? 'text-green-600' : 'text-error'}`}>{saveStatus}</div>}
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">Request for Quote</Text>
      
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Reference" 
            required
            name="referenceNumber" 
            value={form.referenceNumber} 
            onChange={e => {
              setForm(prev => ({ ...prev, referenceNumber: e.target.value }));
              localStorage.setItem('currentReferenceNumber', e.target.value);
            }}
            error={errors.referenceNumber ? 'Required' : ''} 
          />
          <div className="flex items-end gap-2">
            <Button 
              as="button" 
              onClick={handleGet}
              disabled={isGetting}
            >
              {isGetting ? 'Getting...' : 'Get RFQ'}
            </Button>
            <Button 
              as="button" 
              onClick={() => createRFQ(form)}
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

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Basic Information</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Date" 
            type="date" 
            name="date" 
            value={form.date} 
            onChange={handleChange}
            error={errors.date ? 'Required' : ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Company Name" 
            name="companyName" 
            value={form.companyName} 
            onChange={handleChange} 
            error={errors.companyName ? 'Required' : ''}
          />
          <Input 
            label="State/Province" 
            name="state" 
            value={form.state} 
            onChange={handleChange}
          />
          <Input 
            label="Street Address" 
            name="streetAddress" 
            value={form.streetAddress} 
            onChange={handleChange}
          />
          <Input 
            label="ZIP/Postal Code" 
            name="zip" 
            value={form.zip} 
            onChange={handleChange}
          />
          <Input 
            label="City" 
            name="city" 
            value={form.city} 
            onChange={handleChange}
          />
          <Input 
            label="Country" 
            name="country" 
            value={form.country} 
            onChange={handleChange}
          />
          <Input 
            label="Contact Name" 
            name="contactName" 
            value={form.contactName} 
            onChange={handleChange}
          />
          <Input 
            label="Position" 
            name="position" 
            value={form.position} 
            onChange={handleChange}
          />
          <Input 
            label="Phone" 
            name="phone" 
            value={form.phone} 
            onChange={handleChange}
          />
          <Input 
            label="Email" 
            name="email" 
            value={form.email} 
            onChange={handleChange}
          />
          <Input 
            label="Dealer Name" 
            name="dealerName" 
            value={form.dealerName} 
            onChange={handleChange}
          />
          <Input 
            label="Dealer Salesman" 
            name="dealerSalesman" 
            value={form.dealerSalesman} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="How many days/week is the company running?" 
            name="daysPerWeek" 
            value={form.daysPerWeek} 
            onChange={handleChange}
          />
          <Input 
            label="How many shifts/day is the company running?" 
            name="shiftsPerDay" 
            value={form.shiftsPerDay} 
            onChange={handleChange}
          />
          <Select
            label="Line Application" 
            name="lineApplication" 
            value={form.lineApplication} 
            onChange={handleChange} 
            options={[
              { value: "pressFeed", label: "Press Feed" },
              { value: "cutToLength", label: "Cut To Length" },
              { value: "standalone", label: "Standalone" },

            ]}
          />
          <Select
            label="Type of Line"
            name="lineType"
            value={form.lineType}
            onChange={handleChange}
            options={[
              { value: "compact", label: "Compact" },
              { value: "compactCTL", label: "Compact CTL" },
              { value: "conventional", label: "Conventional" },
              { value: "conventionalCTL", label: "Conventional CTL" },
              { value: "pullThrough", label: "Pull Through" },
              { value: "pullThroughCompact", label: "Pull Through Compact" },
              { value: "pullThroughCTL", label: "Pull Through CTL" },
              { value: "feed", label: "Feed" },
              { value: "feedPullThough", label: "Feed-Pull Through"},
              { value: "feedPullThroughShear", label: "Feed-Pull Through-Shear"},
              { value: "feedShear", label: "Feed-Shear"},
              { value: "straightener", label: "Straightener"},
              { value: "straightenerReelCombo", label: "Straightener-Reel Combination" },
              { value: "reelMotorized", label: "Reel-Motorized" },
              { value: "reelPullOff", label: "Reel-Pull Off" },
              { value: "threadingTable", label: "Threading Table" },
              { value: "other", label: "Other" },

            ]}
          />
          <Select
            label="Pull Through"
            name="pullThrough"
            value={form.pullThrough}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            error={errors.pullThrough ? 'Required' : ''}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Coil Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input 
            label="Max Coil Width (in)" 
            name="coilWidthMax" 
            value={form.coilWidthMax} 
            onChange={handleChange} 
            error={errors.coilWidthMax ? 'Required' : ''}
          />
          <Input 
            label="Min Coil Width (in)" 
            name="coilWidthMin" 
            value={form.coilWidthMin} 
            onChange={handleChange} 
            error={errors.coilWidthMin ? 'Required' : ''}
          />
          <Input 
            label="Max Coil O.D. (in)" 
            name="maxCoilOD" 
            value={form.maxCoilOD} 
            onChange={handleChange} 
            error={errors.maxCoilOD ? 'Required' : ''}
          />
          <Input 
            label="Coil I.D. (in)" 
            name="coilID" 
            value={form.coilID} 
            onChange={handleChange} 
            error={errors.coilID ? 'Required' : ''}
          />
          <Input 
            label="Max Coil Weight (lbs)" 
            name="coilWeightMax" 
            value={form.coilWeightMax} 
            onChange={handleChange} 
            error={errors.coilWeightMax ? 'Required' : ''}
          />
          <Input 
            label="Max Coil Handling Capacity (lbs)" 
            type="number" 
            name="coilHandlingMax" 
            value={form.coilHandlingMax} 
            onChange={handleChange}
          />
        </div>

        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox
              label="Slit Edge"
              name="slitEdge"
              checked={form.slitEdge}
              onChange={handleChange}
              error={errors.slitEdge ? 'At least one required' : ''}
            />
            <Checkbox
              label="Mill Edge"
              name="millEdge"
              checked={form.millEdge}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select
            label="Will a coil car be required?"
            name="coilCarRequired"
            value={form.coilCarRequired}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <Select
            label="Will you be running off the Backplate?"
            name="runOffBackplate"
            value={form.runOffBackplate}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
          <Select
            label="Are you running partial coils, i.e. will you require rewinding?"
            name="requireRewinding"
            value={form.requireRewinding}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Material Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Highest Yield/most challenging Mat Spec (thick)" 
            name="matSpec1.thickness" 
            value={form.matSpec1.thickness} 
            onChange={handleChange} 
            error={errors['matSpec1.thickness'] ? 'Required' : ''}
          />
          <Input 
            label="at Width (in)" 
            name="matSpec1.width" 
            value={form.matSpec1.width} 
            onChange={handleChange} 
            error={errors['matSpec1.width'] ? 'Required' : ''}
          />
          <Input 
            label="Material Type" 
            name="matSpec1.type" 
            value={form.matSpec1.type} 
            onChange={handleChange} 
            error={errors['matSpec1.type'] ? 'Required' : ''}
          />
          <Input 
            label="Max Yield Strength (PSI)" 
            name="matSpec1.yield" 
            value={form.matSpec1.yield} 
            onChange={handleChange} 
            error={errors['matSpec1.yield'] ? 'Required' : ''}
          />
          <Input 
            label="Max Tensile Strength (PSI)" 
            name="matSpec1.tensile" 
            value={form.matSpec1.tensile} 
            onChange={handleChange} 
            error={errors['matSpec1.tensile'] ? 'Required' : ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Maximum Material Thickness (in)" 
            name="matSpec2.thickness" 
            value={form.matSpec2.thickness} 
            onChange={handleChange}
          />
          <Input 
            label="at Full Machine Width (in)" 
            name="matSpec2.width" 
            value={form.matSpec2.width} 
            onChange={handleChange}
          />
          <Input 
            label="Material Type" 
            name="matSpec2.type" 
            value={form.matSpec2.type} 
            onChange={handleChange}
          />
          <Input 
            label="Max Yield Strength (PSI)" 
            name="matSpec2.yield" 
            value={form.matSpec2.yield} 
            onChange={handleChange}
          />
          <Input 
            label="Max Tensile Strength (PSI)" 
            name="matSpec2.tensile" 
            value={form.matSpec2.tensile} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Minimum Material Thickness (in)" 
            name="matSpec3.thickness"
            value={form.matSpec3.thickness} 
            onChange={handleChange}
          />
          <Input 
            label="at Minimum Material Width (in)" 
            name="matSpec3.width" 
            value={form.matSpec3.width} 
            onChange={handleChange}
          />
          <Input 
            label="Material Type"
            name="matSpec3.type" 
            value={form.matSpec3.type} 
            onChange={handleChange}
          />
          <Input 
            label="Max Yield Strength (PSI)" 
            name="matSpec3.yield"
            value={form.matSpec3.yield} 
            onChange={handleChange}
          />
          <Input 
            label="Max Tensile Strength (PSI)" 
            name="matSpec3.tensile"
            value={form.matSpec3.tensile} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Max Mat Thickness to be Run (in)" 
            name="matSpec4.thickness" 
            value={form.matSpec4.thickness} 
            onChange={handleChange}
          />
          <Input 
            label="at Width (in)" 
            name="matSpec4.width" 
            value={form.matSpec4.width} 
            onChange={handleChange}
          />
          <Input 
            label="Material Type" 
            name="matSpec4.type" 
            value={form.matSpec4.type} 
            onChange={handleChange}
          />
          <Input 
            label="Max Yield Strength (PSI)" 
            name="matSpec4.yield" 
            value={form.matSpec4.yield} 
            onChange={handleChange}
          />
          <Input 
            label="Max Tensile Strength (PSI)" 
            name="matSpec4.tensile" 
            value={form.matSpec4.tensile} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Select
            label="Does the surface finish matter? Are they running a cosmetic material?"
            name="cosmeticMaterial"
            value={form.cosmeticMaterial}
            onChange={handleChange}
            options={[
              { value: "No", label: "No" },
              { value: "Yes", label: "Yes" },
            ]}
            error={errors.cosmeticMaterial ? 'Required' : ''}
          />
          <Input label="Current brand of feed equipment" name="feedEquipment" value={form.feedEquipment} onChange={handleChange} />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Type of Press</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Checkbox 
            label="Gap Frame Press" 
            name="pressType.gapFrame" 
            checked={form.pressType.gapFrame} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="Hydraulic Press" 
            name="pressType.hydraulic" 
            checked={form.pressType.hydraulic} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="OBI" 
            name="pressType.obi" 
            checked={form.pressType.obi} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="Servo Press" 
            name="pressType.servo" 
            checked={form.pressType.servo} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="Shear Die Application" 
            name="pressType.shearDie" 
            checked={form.pressType.shearDie} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="Straight Side Press" 
            name="pressType.straightSide" 
            checked={form.pressType.straightSide} 
            onChange={handleChange} 
          />
          <Checkbox 
            label="Other" 
            name="pressType.other" 
            checked={form.pressType.other} 
            onChange={handleChange} 
          />

          {form.pressType.other && <Input label="Other..." name="pressType.otherText" value={form.pressType.otherText} onChange={handleChange} />}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Input 
            label="Tonnage of Press"
            name="tonnage" 
            value={form.tonnage} 
            onChange={handleChange}
          />
          <Input 
            label="Press Bed Area: Width (in)" 
            name="pressBedWidth" 
            value={form.pressBedWidth} 
            onChange={handleChange}
          />
          <Input 
            label="Length (in)" 
            name="pressBedLength" 
            value={form.pressBedLength} 
            onChange={handleChange}
          />
          <Input 
            label="Press Stroke Length (in)" 
            name="pressStroke" 
            value={form.pressStroke} 
            onChange={handleChange}
          />
          <Input 
            label="Window Opening Size of Press (in)" 
            name="windowOpening" 
            value={form.windowOpening} 
            onChange={handleChange}
          />
          <Input 
            label="Press Max SPM" 
            name="maxSPM" 
            value={form.maxSPM} 
            onChange={handleChange} 
            error={errors.maxSPM ? 'Required' : ''}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Type of Dies</Text>
        <div className="mb-6">
          <div className="flex flex-wrap gap-6">
            <Checkbox 
              label="Transfer Dies" 
              name="dies.transfer" 
              checked={form.dies.transfer} 
              onChange={handleChange} 
            />
            <Checkbox 
              label="Progressive Dies" 
              name="dies.progressive" 
              checked={form.dies.progressive} 
              onChange={handleChange} 
              required 
              error={errors.dies ? 'At least one required' : ''}
            />
            <Checkbox 
              label="Blanking Dies"
              name="dies.blanking" 
              checked={form.dies.blanking} 
              onChange={handleChange} 
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Input 
            label="Average feed length" 
            name="avgFeedLen" 
            value={form.avgFeedLen} 
            onChange={handleChange} 
            error={errors.avgFeedLen ? 'Required' : ''}
          />
          <Input 
            label="at (SPM)" 
            name="avgFeedSPM" 
            value={form.avgFeedSPM} 
            onChange={handleChange} 
            error={errors.avgFeedSPM ? 'Required' : ''}
          />
          <Input
            label="Feed Speed (FPM)"
            name="avgFPM"
            value={form.avgFPM}
            readOnly
            disabled
          />
          <Input 
            label="Maximum feed length" 
            name="maxFeedLen" 
            value={form.maxFeedLen} 
            onChange={handleChange} 
            error={errors.maxFeedLen ? 'Required' : ''}
          />
          <Input 
            label="at (SPM)" 
            name="maxFeedSPM" 
            value={form.maxFeedSPM} 
            onChange={handleChange} 
            error={errors.maxFeedSPM ? 'Required' : ''}
          />
          <Input
            label="Feed Speed (FPM)"
            name="maxFPM"
            value={form.maxFPM}
            readOnly
            disabled
          />
          <Input 
            label="Minimum feed length" 
            name="minFeedLen" 
            value={form.minFeedLen} 
            onChange={handleChange} 
            error={errors.minFeedLen ? 'Required' : ''}
          />
          <Input 
            label="at (SPM)" 
            name="minFeedSPM" 
            value={form.minFeedSPM} 
            onChange={handleChange} 
            error={errors.minFeedSPM ? 'Required' : ''}
          />
          <Input
            label="Feed Speed (FPM)"
            name="minFPM"
            value={form.minFPM}
            readOnly
            disabled
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Voltage Required (VAC)" 
            name="voltage" 
            value={form.voltage} 
            onChange={handleChange} 
            error={errors.voltage ? 'Required' : ''}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Space & Mounting</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Space allotment Length (ft)" 
            name="spaceLength" 
            value={form.spaceLength} 
            onChange={handleChange}
          />
          <Input 
            label="Width (ft)" 
            name="spaceWidth" 
            value={form.spaceWidth} 
            onChange={handleChange}
          />
        </div>

        <div className="space-y-4 mb-6">
          <Input 
            label="Are there any walls or columns obstructing the equipment's location?" 
            name="obstructions" 
            value={form.obstructions} 
            onChange={handleChange}
          />
          <Input 
            label="Can the feeder be mounted to the press?" 
            name="mountToPress" 
            value={form.mountToPress} 
            onChange={handleChange}
          />
          <Input 
            label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?" 
            name="adequateSupport" 
            value={form.adequateSupport} 
            onChange={handleChange}
          />
          <Input 
            label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?" 
            name="needMountingPlates" 
            value={form.needMountingPlates} 
            onChange={handleChange}
          />
          <Input 
            label="Passline Height (in):" 
            name="passlineHeight" 
            value={form.passlineHeight} 
            onChange={handleChange}
          />
          <Input 
            label="Will there be a loop pit?" 
            name="loopPit" 
            value={form.loopPit} 
            onChange={handleChange}
          />
          <Input 
            label="Is coil change time a concern?" 
            name="coilChangeConcern" 
            value={form.coilChangeConcern} 
            onChange={handleChange}
          />
          <Input 
            label="If so, what is your coil change time goal? (min)" 
            name="coilChangeTime" 
            value={form.coilChangeTime} 
            onChange={handleChange}
          />
          <Input 
            label="What are reasons you experience unplanned downtime?" 
            name="downtimeReasons" 
            value={form.downtimeReasons} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label="Feed Direction" 
            name="feedDirection" 
            value={form.feedDirection} 
            onChange={handleChange} 
            error={errors.feedDirection ? 'Required' : ''}
          />
          <Input 
            label="Coil Loading" 
            name="coilLoading" 
            value={form.coilLoading} 
            onChange={handleChange} 
            error={errors.coilLoading ? 'Required' : ''}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input 
            label="Will your line require guarding or special safety requirements?" 
            name="safetyRequirements" 
            value={form.safetyRequirements} 
            onChange={handleChange}
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Timeline & Delivery</Text>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <Input 
            label="When will decision be made on project?" 
            name="decisionDate" 
            type="date" 
            value={form.decisionDate} 
            onChange={handleChange}
          />
          <Input 
            label="Ideal Delivery Date" 
            name="idealDelivery" 
            type="date" 
            value={form.idealDelivery} 
            onChange={handleChange}
          />
          <Input 
            label="Earliest date customer can accept delivery" 
            name="earliestDelivery" 
            type="date" 
            value={form.earliestDelivery} 
            onChange={handleChange}
          />
          <Input 
            label="Latest date customer can accept delivery" 
            name="latestDelivery" 
            type="date" 
            value={form.latestDelivery} 
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 gap-4">
          <Textarea
            label="Special Considerations"
            name="specialConsiderations"
            value={form.specialConsiderations}
            onChange={handleChange}
            rows={3}
          />
        </div>
      </Card>
    </form>
  );
};

export default RFQ;
