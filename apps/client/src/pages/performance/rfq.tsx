import { useState, useEffect } from "react";
import axios from "axios";
import { Button } from "@/components";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Checkbox from "@/components/shared/checkbox";
import Textarea from "@/components/shared/textarea";
import Text from "@/components/shared/text";
import Card from "@/components/shared/card";

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const initialState = {
  referenceNumber: localStorage.getItem('performanceReferenceNumber') || "",
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
  maxCoilWidth: "",
  minCoilWidth: "",
  maxCoilOD: "",
  coilID: "",
  maxCoilWeight: "",
  maxCoilHandling: "",
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
};

const requiredFields = [
  "referenceNumber", "companyName", "streetAddress", "city", "state", "zip", "country", "contactName", "phone", "email", "lineApplication", "lineType", "pullThrough", "maxCoilWidth", "minCoilWidth", "maxCoilOD", "coilID", "maxCoilWeight", "slitEdge", "matSpec1", "cosmeticMaterial", "maxSPM", "dies", "avgFeedLen", "avgFeedSPM", "maxFeedLen", "maxFeedSPM", "minFeedLen", "minFeedSPM", "voltage", "feedDirection", "coilLoading"
];

type MatSpec = {
  thickness: string;
  width: string;
  type: string;
  yield: string;
  tensile: string;
  [key: string]: string; // Allow dynamic access
};

type PressType = {
  gapFrame: boolean;
  hydraulic: boolean;
  obi: boolean;
  servo: boolean;
  shearDie: boolean;
  straightSide: boolean;
  other: boolean;
  otherText: string;
};

type DiesType = {
  transfer: boolean;
  progressive: boolean;
  blanking: boolean;
};

interface RFQFormState {
  [key: string]: any; // For dynamic access in validation and handleChange
  referenceNumber: string;
  companyName: string;
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
  maxCoilWidth: string;
  minCoilWidth: string;
  maxCoilOD: string;
  coilID: string;
  maxCoilWeight: string;
  maxCoilHandling: string;
  slitEdge: boolean;
  millEdge: boolean;
  coilCarRequired: string;
  runOffBackplate: string;
  requireRewinding: string;
  matSpec1: MatSpec;
  matSpec2: MatSpec;
  matSpec3: MatSpec;
  matSpec4: MatSpec;
  cosmeticMaterial: string;
  feedEquipment: string;
  pressType: PressType;
  tonnage: string;
  pressBedWidth: string;
  pressBedLength: string;
  pressStroke: string;
  windowOpening: string;
  maxSPM: string;
  dies: DiesType;
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

interface RFQErrorState {
  [key: string]: boolean;
}

const RFQ = () => {
  const [form, setForm] = useState<RFQFormState>(() => {
    // Try to load saved form data from localStorage
    const savedForm = localStorage.getItem('rfqFormData');
    return savedForm ? JSON.parse(savedForm) : initialState;
  });
  const [errors, setErrors] = useState<RFQErrorState>({});
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('rfqFormData', JSON.stringify(form));
  }, [form]);

  const sendRFQData = async () => {
    if (!form.referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    
    setIsLoading(true);
    try {
      await instance.post(`/rfq/${form.referenceNumber}`, form);
      setStatus("RFQ data sent successfully!");
    } catch (error) {
      console.error('Error sending RFQ data:', error);
      setStatus("Failed to send RFQ data. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    if (name.includes("pressType.")) {
      setForm((prev: any) => ({
        ...prev,
        pressType: {
          ...prev.pressType,
          [name.split(".")[1]]: type === "checkbox" ? checked : value,
        },
      }));
    } else if (name.includes("dies.")) {
      setForm((prev: any) => ({
        ...prev,
        dies: {
          ...prev.dies,
          [name.split(".")[1]]: checked,
        },
      }));
    } else if (name.startsWith("matSpec")) {
      const [spec, field] = name.split(".");
      setForm((prev: any) => ({
        ...prev,
        [spec]: {
          ...prev[spec],
          [field]: value,
        },
      }));
    } else {
      setForm((prev: any) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    }
  };

  const validate = () => {
    const newErrors: any = {};
    requiredFields.forEach((field) => {
      if (typeof form[field] === "object") {
        // For matSpec1, dies, etc.
        if (field === "matSpec1") {
          ["thickness", "width", "type", "yield", "tensile"].forEach((f) => {
            if (!form[field][f]) newErrors[`${field}.${f}`] = true;
          });
        }
        if (field === "dies") {
          if (!form.dies.transfer && !form.dies.progressive && !form.dies.blanking) {
            newErrors.dies = true;
          }
        }
      } else if (field === "slitEdge") {
        if (!form.slitEdge && !form.millEdge) newErrors.slitEdge = true;
      } else if (!form[field]) {
        newErrors[field] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validate()) {
      setStatus("Please fill all required fields.");
      return;
    }
    try {
      await instance.post("/rfq", form);
      setStatus("RFQ submitted successfully!");
      setForm(initialState);
      setErrors({});
    } catch (err) {
      setStatus("Submission failed. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 1200, margin: '0 auto', fontSize: 14, padding: '24px' }}>
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">Request for Quote</Text>
      
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Input 
            label="Reference Number" 
            required 
            name="referenceNumber" 
            value={form.referenceNumber} 
            onChange={handleChange} 
            error={errors.referenceNumber ? 'Required' : ''} 
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <Button 
              as="button" 
              onClick={() => {
                sendRFQData();
              }}
              disabled={isLoading}
            >
              {isLoading ? 'Sending...' : 'Send Data'}
            </Button>
          </div>
        </div>
        {status && (
          <div className={`mt-2 text-sm ${status.includes('success') ? 'text-green-600' : 'text-text-muted'}`}>
            {status}
          </div>
        )}
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="Company Name" required name="companyName" value={form.companyName} onChange={handleChange} error={errors.companyName ? 'Required' : ''} />
        <Input label="State/Province" required name="state" value={form.state} onChange={handleChange} error={errors.state ? 'Required' : ''} />
        <Input label="Street Address" required name="streetAddress" value={form.streetAddress} onChange={handleChange} error={errors.streetAddress ? 'Required' : ''} />
        <Input label="ZIP/Postal Code" required name="zip" value={form.zip} onChange={handleChange} error={errors.zip ? 'Required' : ''} />
        <Input label="City" required name="city" value={form.city} onChange={handleChange} error={errors.city ? 'Required' : ''} />
        <Input label="Country" required name="country" value={form.country} onChange={handleChange} error={errors.country ? 'Required' : ''} />
        <Input label="Contact Name" required name="contactName" value={form.contactName} onChange={handleChange} error={errors.contactName ? 'Required' : ''} />
        <Input label="Position" name="position" value={form.position} onChange={handleChange} />
        <Input label="Phone" required name="phone" value={form.phone} onChange={handleChange} error={errors.phone ? 'Required' : ''} />
        <Input label="Email" required name="email" value={form.email} onChange={handleChange} error={errors.email ? 'Required' : ''} />
        <Input label="Dealer Name" name="dealerName" value={form.dealerName} onChange={handleChange} />
        <Input label="Dealer Salesman" name="dealerSalesman" value={form.dealerSalesman} onChange={handleChange} />
      </div>
      <hr style={{ margin: '24px 0' }} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <Input label="How many days/week is the company running?" name="daysPerWeek" value={form.daysPerWeek} onChange={handleChange} />
        <Input label="How many shifts/day is the company running?" name="shiftsPerDay" value={form.shiftsPerDay} onChange={handleChange} />
        <Input label="Line Application" required name="lineApplication" value={form.lineApplication} onChange={handleChange} error={errors.lineApplication ? 'Required' : ''} />
        <Input label="Line Type" required name="lineType" value={form.lineType} onChange={handleChange} error={errors.lineType ? 'Required' : ''} />
        <Select
          label="Pull Through"
          required
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
      <h3>Coil Specifications</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        <Input label="Max Coil Width (in)" required type="number" name="maxCoilWidth" value={form.maxCoilWidth} onChange={handleChange} error={errors.maxCoilWidth ? 'Required' : ''} />
        <Input label="Min Coil Width (in)" required type="number" name="minCoilWidth" value={form.minCoilWidth} onChange={handleChange} error={errors.minCoilWidth ? 'Required' : ''} />
        <Input label="Max Coil O.D. (in)" required type="number" name="maxCoilOD" value={form.maxCoilOD} onChange={handleChange} error={errors.maxCoilOD ? 'Required' : ''} />
        <Input label="Coil I.D. (in)" required type="number" name="coilID" value={form.coilID} onChange={handleChange} error={errors.coilID ? 'Required' : ''} />
        <Input label="Max Coil Weight (lbs)" required type="number" name="maxCoilWeight" value={form.maxCoilWeight} onChange={handleChange} error={errors.maxCoilWeight ? 'Required' : ''} />
        <Input label="Max Coil Handling Capacity (lbs)" type="number" name="maxCoilHandling" value={form.maxCoilHandling} onChange={handleChange} />
      </div>
      <div style={{ margin: '12px 0' }}>
        <div style={{ display: 'flex', gap: 24 }}>
          <Checkbox
            label="Slit Edge"
            name="slitEdge"
            checked={form.slitEdge}
            onChange={handleChange}
            required
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
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
      <h3>Material Specifications</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Input label="Highest Yield/most challenging Mat Spec (thick)" required name="matSpec1.thickness" value={form.matSpec1.thickness} onChange={handleChange} error={errors['matSpec1.thickness'] ? 'Required' : ''} />
        <Input label="at Width (in)" required name="matSpec1.width" value={form.matSpec1.width} onChange={handleChange} error={errors['matSpec1.width'] ? 'Required' : ''} />
        <Input label="Material Type" required name="matSpec1.type" value={form.matSpec1.type} onChange={handleChange} error={errors['matSpec1.type'] ? 'Required' : ''} />
        <Input label="Max Yield Strength (PSI)" required name="matSpec1.yield" value={form.matSpec1.yield} onChange={handleChange} error={errors['matSpec1.yield'] ? 'Required' : ''} />
        <Input label="Max Tensile Strength (PSI)" required name="matSpec1.tensile" value={form.matSpec1.tensile} onChange={handleChange} error={errors['matSpec1.tensile'] ? 'Required' : ''} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Input label="Maximum Material Thickness (in)" name="matSpec2.thickness" value={form.matSpec2.thickness} onChange={handleChange} />
        <Input label="at Full Machine Width (in)" name="matSpec2.width" value={form.matSpec2.width} onChange={handleChange} />
        <Input label="Material Type" name="matSpec2.type" value={form.matSpec2.type} onChange={handleChange} />
        <Input label="Max Yield Strength (PSI)" name="matSpec2.yield" value={form.matSpec2.yield} onChange={handleChange} />
        <Input label="Max Tensile Strength (PSI)" name="matSpec2.tensile" value={form.matSpec2.tensile} onChange={handleChange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Input label="Minimum Material Thickness (in)" name="matSpec3.thickness" value={form.matSpec3.thickness} onChange={handleChange} />
        <Input label="at Minimum Material Width (in)" name="matSpec3.width" value={form.matSpec3.width} onChange={handleChange} />
        <Input label="Material Type" name="matSpec3.type" value={form.matSpec3.type} onChange={handleChange} />
        <Input label="Max Yield Strength (PSI)" name="matSpec3.yield" value={form.matSpec3.yield} onChange={handleChange} />
        <Input label="Max Tensile Strength (PSI)" name="matSpec3.tensile" value={form.matSpec3.tensile} onChange={handleChange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
        <Input label="Max Mat Thickness to be Run (in)" name="matSpec4.thickness" value={form.matSpec4.thickness} onChange={handleChange} />
        <Input label="at Width (in)" name="matSpec4.width" value={form.matSpec4.width} onChange={handleChange} />
        <Input label="Material Type" name="matSpec4.type" value={form.matSpec4.type} onChange={handleChange} />
        <Input label="Max Yield Strength (PSI)" name="matSpec4.yield" value={form.matSpec4.yield} onChange={handleChange} />
        <Input label="Max Tensile Strength (PSI)" name="matSpec4.tensile" value={form.matSpec4.tensile} onChange={handleChange} />
      </div>
      <div style={{ margin: '12px 0' }}>
        <Select
          label="Does the surface finish matter? Are they running a cosmetic material?"
          required
          name="cosmeticMaterial"
          value={form.cosmeticMaterial}
          onChange={handleChange}
          options={[
            { value: "No", label: "No" },
            { value: "Yes", label: "Yes" },
          ]}
          error={errors.cosmeticMaterial ? 'Required' : ''}
        />
      </div>
      <div>
        <Input label="Current brand of feed equipment" name="feedEquipment" value={form.feedEquipment} onChange={handleChange} />
      </div>
      <h3>Type of Press</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Checkbox label="Gap Frame Press" name="pressType.gapFrame" checked={form.pressType.gapFrame} onChange={handleChange} />
        <Checkbox label="Hydraulic Press" name="pressType.hydraulic" checked={form.pressType.hydraulic} onChange={handleChange} />
        <Checkbox label="OBI" name="pressType.obi" checked={form.pressType.obi} onChange={handleChange} />
        <Checkbox label="Servo Press" name="pressType.servo" checked={form.pressType.servo} onChange={handleChange} />
        <Checkbox label="Shear Die Application" name="pressType.shearDie" checked={form.pressType.shearDie} onChange={handleChange} />
        <Checkbox label="Straight Side Press" name="pressType.straightSide" checked={form.pressType.straightSide} onChange={handleChange} />
        <Checkbox label="Other" name="pressType.other" checked={form.pressType.other} onChange={handleChange} />
        {form.pressType.other && <Input label="Other..." name="pressType.otherText" value={form.pressType.otherText} onChange={handleChange} />}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        <Input label="Tonnage of Press" name="tonnage" value={form.tonnage} onChange={handleChange} />
        <Input label="Press Bed Area: Width (in)" name="pressBedWidth" value={form.pressBedWidth} onChange={handleChange} />
        <Input label="Length (in)" name="pressBedLength" value={form.pressBedLength} onChange={handleChange} />
        <Input label="Press Stroke Length (in)" name="pressStroke" value={form.pressStroke} onChange={handleChange} />
        <Input label="Window Opening Size of Press (in)" name="windowOpening" value={form.windowOpening} onChange={handleChange} />
        <Input label="Press Max SPM" required name="maxSPM" value={form.maxSPM} onChange={handleChange} error={errors.maxSPM ? 'Required' : ''} />
      </div>
      <h3>Type of Dies</h3>
      <div>
        <div style={{ display: 'flex', gap: 24 }}>
          <Checkbox label="Transfer Dies" name="dies.transfer" checked={form.dies.transfer} onChange={handleChange} />
          <Checkbox label="Progressive Dies" name="dies.progressive" checked={form.dies.progressive} onChange={handleChange} required error={errors.dies ? 'At least one required' : ''} />
          <Checkbox label="Blanking Dies" name="dies.blanking" checked={form.dies.blanking} onChange={handleChange} />
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
        <Input label="Average feed length" required name="avgFeedLen" value={form.avgFeedLen} onChange={handleChange} error={errors.avgFeedLen ? 'Required' : ''} />
        <Input label="at (SPM)" required name="avgFeedSPM" value={form.avgFeedSPM} onChange={handleChange} error={errors.avgFeedSPM ? 'Required' : ''} />
        <Input label="Maximum feed length" required name="maxFeedLen" value={form.maxFeedLen} onChange={handleChange} error={errors.maxFeedLen ? 'Required' : ''} />
        <Input label="at (SPM)" required name="maxFeedSPM" value={form.maxFeedSPM} onChange={handleChange} error={errors.maxFeedSPM ? 'Required' : ''} />
        <Input label="Minimum feed length" required name="minFeedLen" value={form.minFeedLen} onChange={handleChange} error={errors.minFeedLen ? 'Required' : ''} />
        <Input label="at (SPM)" required name="minFeedSPM" value={form.minFeedSPM} onChange={handleChange} error={errors.minFeedSPM ? 'Required' : ''} />
      </div>
      <div style={{ margin: '12px 0' }}>
        <Input label="Voltage Required (VAC)" required name="voltage" value={form.voltage} onChange={handleChange} error={errors.voltage ? 'Required' : ''} />
      </div>
      <h3>Space & Mounting</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Input label="Space allotment Length (ft)" name="spaceLength" value={form.spaceLength} onChange={handleChange} />
        <Input label="Width (ft)" name="spaceWidth" value={form.spaceWidth} onChange={handleChange} />
      </div>
      <div>
        <Input label="Are there any walls or columns obstructing the equipment's location?" name="obstructions" value={form.obstructions} onChange={handleChange} />
      </div>
      <div>
        <Input label="Can the feeder be mounted to the press?" name="mountToPress" value={form.mountToPress} onChange={handleChange} />
      </div>
      <div>
        <Input label="If 'YES', we must verify there is adequate structural support to mount to. Is there adequate support?" name="adequateSupport" value={form.adequateSupport} onChange={handleChange} />
      </div>
      <div>
        <Input label="If 'No', it will require a cabinet. Will you need custom mounting plate(s)?" name="needMountingPlates" value={form.needMountingPlates} onChange={handleChange} />
      </div>
      <div>
        <Input label="Passline Height (in):" name="passlineHeight" value={form.passlineHeight} onChange={handleChange} />
      </div>
      <div>
        <Input label="Will there be a loop pit?" name="loopPit" value={form.loopPit} onChange={handleChange} />
      </div>
      <div>
        <Input label="Is coil change time a concern?" name="coilChangeConcern" value={form.coilChangeConcern} onChange={handleChange} />
      </div>
      <div>
        <Input label="If so, what is your coil change time goal? (min)" name="coilChangeTime" value={form.coilChangeTime} onChange={handleChange} />
      </div>
      <div>
        <Input label="What are reasons you experience unplanned downtime?" name="downtimeReasons" value={form.downtimeReasons} onChange={handleChange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Input label="Feed Direction" required name="feedDirection" value={form.feedDirection} onChange={handleChange} error={errors.feedDirection ? 'Required' : ''} />
        <Input label="Coil Loading" required name="coilLoading" value={form.coilLoading} onChange={handleChange} error={errors.coilLoading ? 'Required' : ''} />
      </div>
      <div>
        <Input label="Will your line require guarding or special safety requirements?" name="safetyRequirements" value={form.safetyRequirements} onChange={handleChange} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <Input label="When will decision be made on project?" name="decisionDate" type="date" value={form.decisionDate} onChange={handleChange} />
        <Input label="Ideal Delivery Date" name="idealDelivery" type="date" value={form.idealDelivery} onChange={handleChange} />
        <Input label="Earliest date customer can accept delivery" name="earliestDelivery" type="date" value={form.earliestDelivery} onChange={handleChange} />
        <Input label="Latest date customer can accept delivery" name="latestDelivery" type="date" value={form.latestDelivery} onChange={handleChange} />
      </div>
      <div>
        <Textarea
          label="Special Considerations"
          name="specialConsiderations"
          value={form.specialConsiderations}
          onChange={handleChange}
          rows={3}
        />
      </div>
      <div style={{ margin: '24px 0', textAlign: 'center' }}>
        {/* This button will submit the form as it is inside a <form> and is the only button. */}
        <Button as="button" onClick={undefined}>Submit RFQ</Button>
        {status && <div style={{ marginTop: 12, color: status.includes('success') ? 'green' : 'red' }}>{status}</div>}
      </div>
    </form>
  );
};

export default RFQ;
