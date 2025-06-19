import { useState, useEffect } from "react";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Checkbox from "@/components/shared/checkbox";
import Text from "@/components/shared/text";
import { Button, Card } from "@/components";
import { useCreateMaterialSpecs, MaterialSpecsFormData } from "@/hooks/performance/use-create-material-specs";
import { useGetMaterialSpecs } from "@/hooks/performance/use-get-material-specs";

interface MaterialSpecsForm {
  referenceNumber: string;
  materialType?: string;
  thickness?: string;
  width?: string;
  yieldStrength?: string;
  tensileStrength?: string;
  customer?: string;
  date?: string;
  coilWeight?: string;
  maxFPM?: string;
  minBendRad?: string;
  minLoopLength?: string;
  coilOD?: string;
  coilID?: string;
  coilODCaclculated?: string;
  feedDirection?: string;
  controlsLevel?: string;
  typeOfLine?: string;
  feedControls?: string;
  passline?: string;
  typeOfRoll?: string;
  reelBackplate?: string;
  reelStyle?: string;
  lightGauge?: boolean;
  nonMarking?: boolean;
  [key: string]: string | boolean | undefined;
}

const initialState: MaterialSpecsForm = {
  referenceNumber: localStorage.getItem('performanceReferenceNumber') || "",
  materialType: "",
  thickness: "",
  width: "",
  yieldStrength: "",
  tensileStrength: "",
  customer: "",
  date: "",
  coilWeight: "",
  maxFPM: "",
  minBendRad: "",
  minLoopLength: "",
  coilOD: "",
  coilID: "",
  coilODCaclculated: "",
  feedDirection: "",
  controlsLevel: "",
  typeOfLine: "",
  feedControls: "",
  passline: "",
  typeOfRoll: "",
  reelBackplate: "",
  reelStyle: "",
  lightGauge: false,
  nonMarking: false
};

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
  coilWeight: 'Coil Weight',
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

const MaterialSpecs = () => {
  const [form, setForm] = useState<MaterialSpecsForm>(initialState);
  const { isLoading, status, errors, createMaterialSpecs } = useCreateMaterialSpecs();
  const { isLoading: isGetting, status: getStatus, fetchedMaterialSpecs, getMaterialSpecs } = useGetMaterialSpecs();
  const [version, setVersion] = useState<'Maximum Thick' | 'Max @ Full' | 'Minimum Thick' | 'Max @ Width'>('Maximum Thick');

  // Get customer and date
  const customer = localStorage.getItem('companyName') || '';
  const today = localStorage.getItem('date') || '';

  // Add customer and date to form state if not present
  useEffect(() => {
    setForm(prev => ({
      ...prev,
      customer: prev.customer || customer,
      date: prev.date || today,
      referenceNumber: localStorage.getItem('performanceReferenceNumber') || '',
    }));
    // Listen for localStorage changes (cross-tab)
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'performanceReferenceNumber') {
        setForm(prev => ({ ...prev, referenceNumber: e.newValue || '' }));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    localStorage.setItem('materialSpecsFormData', JSON.stringify(form));
  }, [form]);

  useEffect(() => {
    if (fetchedMaterialSpecs) {
      setForm(fetchedMaterialSpecs as MaterialSpecsForm);
    }
  }, [fetchedMaterialSpecs]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev: MaterialSpecsForm) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createMaterialSpecs(form);
  };

  const handleGet = async () => {
    await getMaterialSpecs(form.referenceNumber);
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-[1200px] mx-auto text-sm p-6">
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">Material Specifications</Text>
      
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input 
            label="Reference Number" 
            required
            name="referenceNumber" 
            value={form.referenceNumber} 
            onChange={handleChange}
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
              onClick={() => createMaterialSpecs(form)}
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
            required
          />
          <Input
            label="Date"
            name="date"
            type="date"
            value={form.date || today}
            onChange={handleChange}
            required
          />
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Material Specifications</Text>
        {/* Version Tabs (inside the card) */}
        <div className="flex justify-center mb-4">
          {['Maximum Thick', 'Max @ Full', 'Minimum Thick', 'Max @ Width'].map((v) => (
            <button
              key={v}
              type="button"
              className={`px-4 py-2 mx-1 rounded-t border-b-2 font-medium ${version === v ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-transparent bg-gray-100 text-gray-500'}`}
              onClick={() => setVersion(v as any)}
            >
              {v}
            </button>
          ))}
        </div>
        {/* Active Version Badge (inside the card) */}
        <div className="flex justify-center mb-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
            version === 'Maximum Thick' ? 'bg-blue-100 text-blue-800' :
            version === 'Max @ Full' ? 'bg-green-100 text-green-800' :
            version === 'Minimum Thick' ? 'bg-yellow-100 text-yellow-800' :
            'bg-purple-100 text-purple-800'}`}
          >
            {version} Version
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {MATERIAL_SPECS_FIELDS[version].map((field) => (
            <Input
              key={field}
              label={FIELD_LABELS[field] || field}
              required={true}
              name={field}
              type={field.toLowerCase().includes('thickness') || field.toLowerCase().includes('width') || field.toLowerCase().includes('coil') || field.toLowerCase().includes('weight') || field.toLowerCase().includes('strength') || field.toLowerCase().includes('fpm') || field.toLowerCase().includes('rad') || field.toLowerCase().includes('length') ? 'number' : 'text'}
              value={form[field] as string || ''}
              onChange={handleChange}
              error={errors[field as keyof typeof errors] as string | undefined}
            />
          ))}
        </div>
      </Card>

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Other Specifications</Text>
        <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
          <Select
            label="Select Feed Direction"
            name="feedDirection"
            value={form.feedDirection}
            onChange={handleChange}
            options={[
              { value: "rightToLeft", label: "Right to Left" },
              { value: "leftToRight", label: "Left to Right" },
            ]}
            error={errors.feedDirection}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={form.controlsLevel}
            onChange={handleChange}
            options={[
              { value: "miniDriveSystem", label: "Mini-Drive System" },
              { value: "relayMachine", label: "Relay Machine" },
              { value: "syncMaster", label: "SyncMaster" },
              { value: "ipIndexerBasic", label: "IP Indexer Basic" },
              { value: "allenBradleyBasic", label: "Allen Bradley Basic" },
              { value: "syncMasterPlus", label: "SyncMaster Plus" },
              { value: "ipIndexerPlus", label: "IP Indexer Plus" },
              { value: "allenBradleyPlus", label: "Allen Bradley Plus" },
              { value: "fullyAutoamtic", label: "Fully Automatic"}
            ]}
            error={errors.feedDirection}
          />
          <Select
            label="Type of Line"
            name="typeOfLine"
            value={form.typeOfLine}
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
            error={errors.feedDirection}
          />

          <Input 
            label="Feed Controls"
            name="feedControls"
            type="text"
            value={form.feedControls}
            onChange={handleChange}
            error={errors.feedControls}
            disabled
          />

          <Select
            label="Passline"
            name="passline"
            value={form.passline}
            onChange={handleChange}
            options={[
              { value: "none", label: "None" },
              { value: "37", label: "37\"" },
              { value: "39", label: "39\"" },
              { value: "40", label: "40\"" },
              { value: "40.5", label: "40.5\"" },
              { value: "41", label: "41\"" },
              { value: "41.5", label: "41.5\"" },
              { value: "42", label: "42\"" },
              { value: "43", label: "43\"" },
              { value: "43.625", label: "43.625\"" },
              { value: "44", label: "44\"" },
              { value: "45", label: "45\"" },
              { value: "45.5", label: "45.5\"" },
              { value: "46", label: "46\"" },
              { value: "46.5", label: "46.5\"" },
              { value: "47", label: "47\"" },
              { value: "47.4", label: "47.4\"" },
              { value: "47.5", label: "47.5\"" },
              { value: "48", label: "48\"" },
              { value: "48.5", label: "48.5\"" },
              { value: "49", label: "49\"" },
              { value: "49.5", label: "49.5\"" },
              { value: "50", label: "50\"" },
              { value: "50.5", label: "50.5\"" },
              { value: "50.75", label: "50.75\"" },
              { value: "51", label: "51\"" },
              { value: "51.5", label: "51.5\"" },
              { value: "51.75", label: "51.75\"" },
              { value: "52", label: "52\"" },
              { value: "52.25", label: "52.25\"" },
              { value: "52.5", label: "52.5\"" },
              { value: "53", label: "53\"" },
              { value: "54", label: "54\"" },
              { value: "54.5", label: "54.5\"" },
              { value: "54.75", label: "54.75\"" },
              { value: "55", label: "55\"" },
              { value: "55.25", label: "55.25\"" },
              { value: "55.5", label: "55.5\"" },
              { value: "55.75", label: "55.75\"" },
              { value: "56", label: "56\"" },
              { value: "56.5", label: "56.5\"" },
              { value: "57", label: "57\"" },
              { value: "58", label: "58\"" },
              { value: "58.25", label: "58.25\"" },
              { value: "59", label: "59\"" },
              { value: "59.5", label: "59.5\"" },
              { value: "60", label: "60\"" },
              { value: "60.5", label: "60.5\"" },
              { value: "61", label: "61\"" },
              { value: "62", label: "62\"" },
              { value: "62.5", label: "62.5\"" },
              { value: "63", label: "63\"" },
              { value: "64", label: "64\"" },
              { value: "64.5", label: "64.5\"" },
              { value: "65", label: "65\"" },
              { value: "66", label: "66\"" },
              { value: "66.5", label: "66.5\"" },
              { value: "67", label: "67\"" },
              { value: "70", label: "70\"" },
              { value: "72", label: "72\"" },
              { value: "75", label: "75\"" },
              { value: "76", label: "76\"" },

            ]}
            error={errors.feedDirection}
          />
          
          <Select
            label="Select Roll"
            name="typeOfRoll"
            value={form.typeOfRoll}
            onChange={handleChange}
            options={[
              { value: "7RollStrBackbend", label: "7 Roll Str. Backbend" },
              { value: "9RollStrBackbend", label: "9 Roll Str. Backbend" },
              { value: "11RollStrBackbend", label: "11 Roll Str. Backbend" },
            ]}
            error={errors.feedDirection}
          />

          <Select
            label="Reel Backplate"
            name="reelBackplate"
            value={form.reelBackplate}
            onChange={handleChange}
            options={[
              { value: "standardBackplate", label: "Standard Backplate" },
              { value: "fullODBackplate", label: "Full OD Backplate" },
            ]}
            error={errors.feedDirection}
          />

          <Select
            label="Reel Style"
            name="reelStyle"
            value={form.reelStyle}
            onChange={handleChange}
            options={[
              { value: "singleEnded", label: "Single Ended" },
              { value: "doubleEnded", label: "Double Ended" },
            ]}
            error={errors.feedDirection}
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

      <div className="text-center">
        <Button as="button">Save Material Specs</Button>
      </div>
    </form>
  );
};

export default MaterialSpecs; 