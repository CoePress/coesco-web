import { useEffect, useState } from "react";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Checkbox from "@/components/shared/checkbox";
import Text from "@/components/shared/text";
import Tabs from "@/components/shared/tabs";
import { Button, Card } from "@/components";
import { useCreateMaterialSpecs, MaterialSpecsFormData } from "@/hooks/performance/use-create-material-specs";
import { useGetMaterialSpecs } from "@/hooks/performance/use-get-material-specs";
import { snakeToCamel } from "@/utils";
import { usePerformanceSheet, initialState, PerformanceSheetState } from '@/contexts/performance.context';
import { mapBackendToFrontendMaterialSpecs } from '@/utils/material-specs-mapping';

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

const getSavedSpecs = (reference: string) => {
  const saved = localStorage.getItem(`materialSpecsFormData_${reference}`);
  return saved ? JSON.parse(saved) : null;
};

const versionKeyMap = {
  'Maximum Thick': 'MaximumThick',
  'Max @ Full': 'MaxAtFull',
  'Minimum Thick': 'MinimumThick',
  'Max @ Width': 'MaxAtWidth',
} as const;

const MaterialSpecs = () => {
  const { performanceSheet: form, setPerformanceSheet, updatePerformanceSheet } = usePerformanceSheet();
  const { isLoading, status, errors, createMaterialSpecs, updateMaterialSpecs } = useCreateMaterialSpecs();
  const { isLoading: isGetting, status: getStatus, fetchedMaterialSpecs, getMaterialSpecs } = useGetMaterialSpecs();
  const [version, setVersion] = useState<'Maximum Thick' | 'Max @ Full' | 'Minimum Thick' | 'Max @ Width'>('Maximum Thick');
  const [saveStatus, setSaveStatus] = useState('');

  // Get customer and date
  const customer = localStorage.getItem('companyName') || '';
  const today = localStorage.getItem('date') || '';

  // Get coil width boundaries from RFQ form (as numbers)
  const minCoilWidth = Number(form.minCoilWidth) || undefined;
  const maxCoilWidth = Number(form.maxCoilWidth) || undefined;

  useEffect(() => {
    if (form.referenceNumber) {
      localStorage.setItem(`materialSpecsFormData_${form.referenceNumber}`, JSON.stringify(form));
      localStorage.setItem('currentReferenceNumber', form.referenceNumber);
    }
  }, [form]);

  useEffect(() => {
    const ref = localStorage.getItem('currentReferenceNumber') || '';
    if (ref && ref !== form.referenceNumber) {
      updatePerformanceSheet({ referenceNumber: ref });
    }
  }, []);

  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'currentReferenceNumber' && e.newValue && e.newValue !== form.referenceNumber) {
        updatePerformanceSheet({ referenceNumber: e.newValue });
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [form.referenceNumber]);

  useEffect(() => {
    if (fetchedMaterialSpecs) {
      const mapped = mapBackendToFrontendMaterialSpecs(fetchedMaterialSpecs);
      // Always preserve the user's referenceNumber in the form state
      mapped.referenceNumber = form.referenceNumber || mapped.referenceNumber;
      console.log('[MaterialSpecs] Mapped data to setPerformanceSheet:', mapped);
      setPerformanceSheet(snakeToCamel(mapped) as PerformanceSheetState);
    }
  }, [fetchedMaterialSpecs, setPerformanceSheet]);

  useEffect(() => {
    if (form.referenceNumber) {
      getMaterialSpecs(form.referenceNumber).then((data: any) => {
        if (data && (data.referenceNumber || data.reference)) {
          const mapped = mapBackendToFrontendMaterialSpecs(data);
          mapped.referenceNumber = form.referenceNumber;
          setPerformanceSheet(snakeToCamel(mapped) as PerformanceSheetState);
        }
      });
    }
  }, [form.referenceNumber]);

  const currentVersionKey = versionKeyMap[version];
  const versionData = form[currentVersionKey] || {};

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (name === 'referenceNumber') {
      updatePerformanceSheet({ referenceNumber: value });
      localStorage.setItem('currentReferenceNumber', value);
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

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (form.referenceNumber) {
      const status = await updateMaterialSpecs(form.referenceNumber, form);
      setSaveStatus(status);
      if (status === 'Saved') {
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }
  };

  const handleSelectChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    handleChange(e);
    // if (form.referenceNumber) {
    //   const status = await updateMaterialSpecs(form.referenceNumber, form);
    //   setSaveStatus(status);
    //   if (status === 'Saved') {
    //     setTimeout(() => setSaveStatus(''), 2000);
    //   }
    // }
  };

  const handleCheckboxChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    if (form.referenceNumber) {
      const status = await updateMaterialSpecs(form.referenceNumber, form);
      setSaveStatus(status);
      if (status === 'Saved') {
        setTimeout(() => setSaveStatus(''), 2000);
      }
    }
  };

  // Only create material specs if Send Data is pressed and no data exists for the reference
  const handleSendData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fetchedMaterialSpecs) {
      await createMaterialSpecs(form);
    } else {
      // Optionally, show a message that specs already exist
      // setStatus('Material specs already exist for this reference.');
    }
  };

  // Only fetch material specs, do not create
  const handleGet = async () => {
    const data = await getMaterialSpecs(form.referenceNumber);
    console.log('[MaterialSpecs] Data returned from getMaterialSpecs:', data);
  };

  return (
    <form onSubmit={handleSendData} className="max-w-[1200px] mx-auto text-sm p-6">
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">Material Specifications</Text>
      
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
              {isGetting ? 'Getting...' : 'Get Material Specs'}
            </Button>
            <Button 
              as="button" 
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
            value={form.date || today}
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
          {MATERIAL_SPECS_FIELDS[version].map((field) => (
            <Input
              key={field}
              label={FIELD_LABELS[field] || field}
              name={field}
              type={field.toLowerCase().includes('thickness') || field.toLowerCase().includes('width') || field.toLowerCase().includes('coil') || field.toLowerCase().includes('weight') || field.toLowerCase().includes('strength') || field.toLowerCase().includes('fpm') || field.toLowerCase().includes('rad') || field.toLowerCase().includes('length') ? 'number' : 'text'}
              value={versionData[field] ?? ''}
              onChange={handleChange}
              error={errors[field as keyof typeof errors] as string | undefined}
              min={field === 'coilWidth' ? minCoilWidth : undefined}
              max={field === 'coilWidth' ? maxCoilWidth : undefined}
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
            value={form.feedDirection ?? ''}
            onChange={handleSelectChange}
            options={[
              { value: "rightToLeft", label: "Right to Left" },
              { value: "leftToRight", label: "Left to Right" },
            ]}
            error={errors.feedDirection}
          />
          <Select
            label="Select Controls Level"
            name="controlsLevel"
            value={form.controlsLevel ?? ''}
            onChange={handleSelectChange}
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
            value={form.typeOfLine ?? ''}
            onChange={handleSelectChange}
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
            value={form.feedControls ?? ''}
            onChange={handleChange}
            error={errors.feedControls}
            disabled
          />

          <Select
            label="Passline"
            name="passline"
            value={form.passline ?? ''}
            onChange={handleSelectChange}
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
            value={form.typeOfRoll ?? ''}
            onChange={handleSelectChange}
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
            value={form.reelBackplate ?? ''}
            onChange={handleSelectChange}
            options={[
              { value: "standardBackplate", label: "Standard Backplate" },
              { value: "fullODBackplate", label: "Full OD Backplate" },
            ]}
            error={errors.feedDirection}
          />

          <Select
            label="Reel Style"
            name="reelStyle"
            value={form.reelStyle ?? ''}
            onChange={handleSelectChange}
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
            onChange={handleCheckboxChange}
          />
          <Checkbox 
            label="Non-Marking" 
            name="nonMarking" 
            checked={form.nonMarking} 
            onChange={handleCheckboxChange}
          />
        </div>
      </Card>

      {saveStatus && (
        <div className="mt-2 text-sm text-green-600">
          {saveStatus}
        </div>
      )}
    </form>
  );
};

export default MaterialSpecs; 