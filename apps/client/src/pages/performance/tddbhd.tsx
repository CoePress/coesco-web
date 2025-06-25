import Card from "@/components/shared/card";
import Input from "@/components/shared/input";
import Text from "@/components/shared/text";
import Tabs from "@/components/shared/tabs";
import { useState, useEffect } from "react";
import { Button } from "@/components";
import { useCreateTDDBHD } from '@/hooks/performance/use-create-tddbhd';
import { useGetTDDBHD } from '@/hooks/performance/use-get-tddbhd';
import { snakeToCamel } from "@/utils";

const VERSIONS = [
  "Maximum Thick",
  "Max @ Full",
  "Minimum Thick",
  "Max @ Width",
] as const;

type VersionKey = typeof VERSIONS[number];

type TDDBHDData = {
  referenceNumber: string;
  customer: string;
  date: string;
  reel: {
    model: string;
    width: string;
    backplate: string;
    materialType: string;
    materialWidth: string;
    thickness: string;
    yieldStrength: string;
    airPressure: string;
    decelRate: string;
  };
  coil: {
    weight: string;
    od: string;
    dispReel: string;
    webTensionPsi: string;
    webTensionLbs: string;
  };
  brake: {
    padDiameter: string;
    cylinderBore: string;
    friction: string;
  };
  threadingDrive: {
    airClutch: string;
    hydThreadingDrive: string;
    torqueAtMandrel: string;
    rewindTorque: string;
  };
  holdDown: {
    assy: string;
    pressure: string;
    forceRequired: string;
    forceAvailable: string;
    minWidth: string;
  };
  cylinder: {
    type: string;
    pressure: string;
  };
  dragBrake: {
    model: string;
    quantity: string;
    torqueRequired: string;
    failsafePSI: string;
    failsafeHoldingForce: string;
  };
};

const defaultTDDBHDData: TDDBHDData = {
  referenceNumber: '',
  customer: '',
  date: '',
  reel: {
    model: '', width: '', backplate: '', materialType: '', materialWidth: '', thickness: '', yieldStrength: '', airPressure: '', decelRate: ''
  },
  coil: {
    weight: '', od: '', dispReel: '', webTensionPsi: '', webTensionLbs: ''
  },
  brake: {
    padDiameter: '', cylinderBore: '', friction: ''
  },
  threadingDrive: {
    airClutch: '', hydThreadingDrive: '', torqueAtMandrel: '', rewindTorque: ''
  },
  holdDown: {
    assy: '', pressure: '', forceRequired: '', forceAvailable: '', minWidth: ''
  },
  cylinder: {
    type: '', pressure: ''
  },
  dragBrake: {
    model: '', quantity: '', torqueRequired: '', failsafePSI: '', failsafeHoldingForce: ''
  }
};

function getField(
  ms: any,
  rfq: any,
  msField: string,
  rfqField: string,
  version: VersionKey
) {
  // Try to get from Material Specs (versioned), then RFQ, then empty string
  if (ms && ms[msField + "_" + version]) return ms[msField + "_" + version];
  if (ms && ms[msField]) return ms[msField];
  if (rfq && rfq[rfqField]) return rfq[rfqField];
  return "";
}

export default function TDDBHD() {
  const [confirmed, setConfirmed] = useState(false);
  const [version, setVersion] = useState<VersionKey>(VERSIONS[0]);
  const [materialSpecs, setMaterialSpecs] = useState<any>(null);
  const [rfq, setRFQ] = useState<any>(null);
  const [status, setStatus] = useState<string>("");
  const [form, setForm] = useState<TDDBHDData>(() => getInitialData(VERSIONS[0], {}, {}));
  const { createTDDBHD, isLoading: isSaving, status: backendStatus } = useCreateTDDBHD();
  const { getTDDBHD, isLoading: isGetting, status: getBackendStatus } = useGetTDDBHD();

  // Helper to get initial data for a version
  function getInitialData(version: VersionKey, materialSpecs: any = {}, rfq: any = {}): TDDBHDData {
    return {
      referenceNumber: rfq?.referenceNumber || materialSpecs?.referenceNumber || '',
      customer: rfq?.companyName || materialSpecs?.customer || '',
      date: rfq?.date || materialSpecs?.date || '',
      reel: {
        model: getField(materialSpecs, rfq, "reelModel", "reelModel", version),
        width: getField(materialSpecs, rfq, "width", "reelWidth", version),
        backplate: getField(materialSpecs, rfq, "reelBackplate", "backplateDiameter", version),
        materialType: getField(materialSpecs, rfq, "materialType", "materialType", version),
        materialWidth: getField(materialSpecs, rfq, "materialWidth", "materialWidth", version),
        thickness: getField(materialSpecs, rfq, "materialThickness", "materialThickness", version),
        yieldStrength: getField(materialSpecs, rfq, "yieldStrength", "materialYieldStrength", version),
        airPressure: getField(materialSpecs, rfq, "airPressure", "airPressureAvailable", version),
        decelRate: getField(materialSpecs, rfq, "decelRate", "requiredDecelRate", version),
      },
      coil: {
        weight: getField(materialSpecs, rfq, "coilWeight", "coilWeight", version),
        od: getField(materialSpecs, rfq, "coilOD", "coilOD", version),
        dispReel: getField(materialSpecs, rfq, "dispReel", "dispReelMtr", version),
        webTensionPsi: getField(materialSpecs, rfq, "webTensionPsi", "webTensionPsi", version),
        webTensionLbs: getField(materialSpecs, rfq, "webTensionLbs", "webTensionLbs", version),
      },
      brake: {
        padDiameter: getField(materialSpecs, rfq, "brakePadDiameter", "brakePadDiameter", version),
        cylinderBore: getField(materialSpecs, rfq, "cylinderBore", "cylinderBore", version),
        friction: getField(materialSpecs, rfq, "friction", "coefficientOfFriction", version),
      },
      threadingDrive: {
        airClutch: getField(materialSpecs, rfq, "airClutch", "airClutch", version),
        hydThreadingDrive: getField(materialSpecs, rfq, "hydThreadingDrive", "hydThreadingDrive", version),
        torqueAtMandrel: getField(materialSpecs, rfq, "torqueAtMandrel", "torqueAtMandrel", version),
        rewindTorque: getField(materialSpecs, rfq, "rewindTorque", "rewindTorqueReq", version),
      },
      holdDown: {
        assy: getField(materialSpecs, rfq, "holdDownAssy", "holdDownAssy", version),
        pressure: getField(materialSpecs, rfq, "holddownPressure", "holddownPressure", version),
        forceRequired: getField(materialSpecs, rfq, "holdDownForceRequired", "holdDownForceRequired", version),
        forceAvailable: getField(materialSpecs, rfq, "holdDownForceAvailable", "holdDownForceAvailable", version),
        minWidth: getField(materialSpecs, rfq, "minMaterialWidth", "minMaterialWidth", version),
      },
      cylinder: {
        type: getField(materialSpecs, rfq, "cylinderType", "cylinderType", version),
        pressure: getField(materialSpecs, rfq, "cylinderPressure", "cylinderPressure", version),
      },
      dragBrake: {
        model: getField(materialSpecs, rfq, "brakeModel", "brakeModel", version),
        quantity: getField(materialSpecs, rfq, "brakeQuantity", "brakeQuantity", version),
        torqueRequired: getField(materialSpecs, rfq, "torqueRequired", "torqueRequired", version),
        failsafePSI: getField(materialSpecs, rfq, "failsafeSingleStagePsi", "failsafeSingleStagePsi", version),
        failsafeHoldingForce: getField(materialSpecs, rfq, "failsafeHoldingForce", "failsafeHoldingForce", version),
      },
    };
  }

  // Load from storage or initialize on mount and version change
  useEffect(() => {
    const ms = localStorage.getItem("materialSpecsFormData");
    const rfq = localStorage.getItem("rfqFormData");
    setMaterialSpecs(ms ? JSON.parse(ms) : null);
    setRFQ(rfq ? JSON.parse(rfq) : null);
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(`tddbhdFormData_${version}`);
    if (stored) {
      setForm(snakeToCamel(JSON.parse(stored)));
    } else {
      setForm(getInitialData(version, materialSpecs, rfq));
    }
  }, [version, materialSpecs, rfq]);

  // Save to storage on form change
  useEffect(() => {
    if (form) {
      localStorage.setItem(`tddbhdFormData_${version}`, JSON.stringify(form));
    }
  }, [form, version]);

  function handleInputChange(section: keyof TDDBHDData, field: string, value: string) {
    setForm(prev => {
      const prevData = prev ?? defaultTDDBHDData;
      return {
        ...prevData,
        [section]: Object.assign({}, (prevData[section] || {}), { [field]: value })
      };
    });
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleGetData() {
    if (!form.referenceNumber) {
      setStatus('No reference number.');
      return;
    }
    try {
      const backendData = await getTDDBHD(form.referenceNumber);
      if (backendData) {
        const camelData = snakeToCamel(backendData);
        setForm((prev: TDDBHDData | undefined) => {
          const prevData = prev ?? defaultTDDBHDData;
          return Object.assign({}, prevData, {
            referenceNumber: camelData.referenceNumber || prevData.referenceNumber || '',
            customer: camelData.customer || prevData.customer || '',
            date: camelData.date || prevData.date || '',
            reel: camelData.reelSpecs,
            coil: {
              weight: camelData.coilBrakeSpecs.coilWeight,
              od: camelData.coilBrakeSpecs.coilOD,
              dispReel: camelData.coilBrakeSpecs.dispReel,
              webTensionPsi: camelData.coilBrakeSpecs.webTension,
              webTensionLbs: camelData.coilBrakeSpecs.webTension2,
            },
            brake: {
              padDiameter: camelData.coilBrakeSpecs.brakePadDiameter,
              cylinderBore: camelData.coilBrakeSpecs.cylinderBore,
              friction: camelData.coilBrakeSpecs.friction,
            },
            threadingDrive: camelData.threadingDrive,
            holdDown: camelData.holdDown,
            cylinder: camelData.cylinder,
            dragBrake: camelData.dragBrake,
          });
        });
        setConfirmed(camelData.confirmedMinWidthOK || false);
        setStatus('Loaded from backend.');
      } else {
        const stored = localStorage.getItem(`tddbhdFormData_${version}`);
        if (stored) {
          setForm(snakeToCamel(JSON.parse(stored)));
          setStatus('Loaded from localStorage.');
        } else {
          setStatus('No saved data found.');
        }
      }
    } catch (err) {
      const stored = localStorage.getItem(`tddbhdFormData_${version}`);
      if (stored) {
        setForm(snakeToCamel(JSON.parse(stored)));
        setStatus('Backend unavailable. Loaded from localStorage.');
      } else {
        setStatus('Backend unavailable. No saved data found.');
      }
    }
  }

  async function handleSetData() {
    if (!form) return;
    const tddbhdFormData = {
      referenceNumber: form.referenceNumber,
      customer: form.customer,
      date: form.date,
      reelSpecs: { ...form.reel },
      coilBrakeSpecs: {
        coilWeight: form.coil.weight,
        coilOD: form.coil.od,
        dispReel: form.coil.dispReel,
        webTension: form.coil.webTensionPsi,
        webTension2: form.coil.webTensionLbs,
        brakePadDiameter: form.brake.padDiameter,
        cylinderBore: form.brake.cylinderBore,
        friction: form.brake.friction,
      },
      threadingDrive: { ...form.threadingDrive },
      holdDown: { ...form.holdDown },
      cylinder: { ...form.cylinder },
      dragBrake: { ...form.dragBrake },
      resultsTable: [],
      confirmedMinWidthOK: confirmed,
    };
    try {
      await createTDDBHD(tddbhdFormData);
      setStatus('Saved to backend.');
    } catch (err) {
      localStorage.setItem(`tddbhdFormData_${version}`, JSON.stringify(form));
      setStatus('Backend unavailable. Saved to localStorage.');
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    // Optionally just save to localStorage or do nothing
    if (form) {
      localStorage.setItem(`tddbhdFormData_${version}`, JSON.stringify(form));
      setStatus('Saved to localStorage.');
    }
  }

  // Use form state for all fields
  const data = form;

  return (
    <form className="max-w-[1200px] mx-auto text-sm p-6" onSubmit={handleSubmit}>
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">
        THREADING DRIVE, DRAG BRAKE & HOLDDOWN
      </Text>
      {/* Reference Info */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div className="grid grid-cols-2 gap-6">
          <Input label="Reference" name="referenceNumber" value={data.referenceNumber} onChange={handleChange} required />
          <div className="flex items-end gap-2">
            <Button as="button" onClick={handleGetData} disabled={isGetting}>Get TDDBHD</Button>
            <Button as="button" onClick={handleSetData} disabled={isSaving}>Set Data</Button>
          </div>
        </div>
      </Card>
      {/* Customer and Date Info */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Customer & Date</Text>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input label="Customer" name="customer" value={data.customer} onChange={handleChange} />
          <Input label="Date" name="date" type="date" value={data.date} onChange={handleChange} />
        </div>
      </Card>
      {/* Version Tabs and Badge */}
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reel & Material Specs</Text>
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
          <Tabs activeTab={version} setActiveTab={tab => setVersion(tab as VersionKey)} tabs={VERSIONS.map(v => ({ label: v, value: v }))} />
        </div>
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
      {/* TD/DB/HD Layout for selected version */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Reel Model" value={data.reel.model} onChange={e => handleInputChange('reel', 'model', e.target.value)} />
          <Input label="Reel Width" value={data.reel.width} onChange={e => handleInputChange('reel', 'width', e.target.value)} />
          <Input label="Backplate Diameter" value={data.reel.backplate} onChange={e => handleInputChange('reel', 'backplate', e.target.value)} />
          <Input label="Material Type" value={data.reel.materialType} onChange={e => handleInputChange('reel', 'materialType', e.target.value)} />
          <Input label="Material Width (in)" value={data.reel.materialWidth} onChange={e => handleInputChange('reel', 'materialWidth', e.target.value)} />
          <Input label="Material Thickness (in)" value={data.reel.thickness} onChange={e => handleInputChange('reel', 'thickness', e.target.value)} />
          <Input label="Material Yield Strength (psi)" value={data.reel.yieldStrength} onChange={e => handleInputChange('reel', 'yieldStrength', e.target.value)} />
          <Input label="Air Pressure Available (psi)" value={data.reel.airPressure} onChange={e => handleInputChange('reel', 'airPressure', e.target.value)} />
          <Input label="Required Decel. Rate (ft/sec²)" value={data.reel.decelRate} onChange={e => handleInputChange('reel', 'decelRate', e.target.value)} />
        </div>
      </Card>
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Coil, Brake & Other Specs</Text>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Input label="Coil Weight (lbs)" value={data.coil.weight} onChange={e => handleInputChange('coil', 'weight', e.target.value)} />
          <Input label="Coil O.D. (in)" value={data.coil.od} onChange={e => handleInputChange('coil', 'od', e.target.value)} />
          <Input label="Disp. (Reel) Mtr." value={data.coil.dispReel} onChange={e => handleInputChange('coil', 'dispReel', e.target.value)} />
          <Input label="Web Tension (psi)" value={data.coil.webTensionPsi} onChange={e => handleInputChange('coil', 'webTensionPsi', e.target.value)} />
          <Input label="Web Tension (lbs)" value={data.coil.webTensionLbs} onChange={e => handleInputChange('coil', 'webTensionLbs', e.target.value)} />
          <Input label="Brake Pad Diameter (in)" value={data.brake.padDiameter} onChange={e => handleInputChange('brake', 'padDiameter', e.target.value)} />
          <Input label="Cylinder Bore (in)" value={data.brake.cylinderBore} onChange={e => handleInputChange('brake', 'cylinderBore', e.target.value)} />
          <Input label="Coefficient of Friction" value={data.brake.friction} onChange={e => handleInputChange('brake', 'friction', e.target.value)} />
        </div>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Threading Drive</Text>
          <Input label="Air Clutch" value={data.threadingDrive.airClutch} onChange={e => handleInputChange('threadingDrive', 'airClutch', e.target.value)} />
          <Input label="Hyd. Threading Drive" value={data.threadingDrive.hydThreadingDrive} onChange={e => handleInputChange('threadingDrive', 'hydThreadingDrive', e.target.value)} />
          <Input label="Torque At Mandrel (in. lbs.)" value={data.threadingDrive.torqueAtMandrel} onChange={e => handleInputChange('threadingDrive', 'torqueAtMandrel', e.target.value)} />
          <Input label="Rewind Torque Req. (in. lbs.)" value={data.threadingDrive.rewindTorque} onChange={e => handleInputChange('threadingDrive', 'rewindTorque', e.target.value)} />
        </Card>
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Hold Down</Text>
          <Input label="Hold Down Assy" value={data.holdDown.assy} onChange={e => handleInputChange('holdDown', 'assy', e.target.value)} />
          <Input label="Holddown Pressure (psi)" value={data.holdDown.pressure} onChange={e => handleInputChange('holdDown', 'pressure', e.target.value)} />
          <Input label="Hold Down Force Required (lbs)" value={data.holdDown.forceRequired} onChange={e => handleInputChange('holdDown', 'forceRequired', e.target.value)} />
          <Input label="Hold Down Force Available (lbs)" value={data.holdDown.forceAvailable} onChange={e => handleInputChange('holdDown', 'forceAvailable', e.target.value)} />
          <Input label="Min. Material Width (in)" value={data.holdDown.minWidth} onChange={e => handleInputChange('holdDown', 'minWidth', e.target.value)} />
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Cylinder</Text>
          <Input label="Type" value={data.cylinder.type} onChange={e => handleInputChange('cylinder', 'type', e.target.value)} />
          <Input label="Pressure (psi)" value={data.cylinder.pressure} onChange={e => handleInputChange('cylinder', 'pressure', e.target.value)} />
        </Card>
        <Card className="p-6">
          <Text as="h3" className="mb-4 text-lg font-medium">Drag Brake</Text>
          <Input label="Brake Model" value={data.dragBrake.model} onChange={e => handleInputChange('dragBrake', 'model', e.target.value)} />
          <Input label="Brake Quantity" value={data.dragBrake.quantity} onChange={e => handleInputChange('dragBrake', 'quantity', e.target.value)} />
          <Input label="Torque Required (in. lbs.)" value={data.dragBrake.torqueRequired} onChange={e => handleInputChange('dragBrake', 'torqueRequired', e.target.value)} />
          <Input label="Failsafe - Single Stage (psi air req.)" value={data.dragBrake.failsafePSI} onChange={e => handleInputChange('dragBrake', 'failsafePSI', e.target.value)} />
          <Input label="Failsafe Holding Force (in. lbs.)" value={data.dragBrake.failsafeHoldingForce} onChange={e => handleInputChange('dragBrake', 'failsafeHoldingForce', e.target.value)} />
        </Card>
      </div>
      {status && <div className="text-center text-xs text-primary mt-2">{status}</div>}
      {backendStatus && <div className="text-center text-xs text-primary mt-2">{backendStatus}</div>}
      {getBackendStatus && <div className="text-center text-xs text-primary mt-2">{getBackendStatus}</div>}
    </form>
  );
} 