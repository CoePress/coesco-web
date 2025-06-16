import { useState, useEffect } from "react";
import axios from "axios";
import Input from "@/components/shared/input";
import Select from "@/components/shared/select";
import Text from "@/components/shared/text";
import { Button, Card } from "@/components";

type Scenario = {
  width: string;
  weight: string;
  thickness: string;
  type: string;
  yield: string;
  tensile: string;
  maxFPM: string;
  minBend: string;
  minLoop: string;
  od: string;
  id: string;
  odCalc: string;
  [key: string]: string;
};

const scenarioDefaults: Scenario[] = [
  {
    width: "",
    weight: "",
    thickness: "",
    type: "",
    yield: "",
    tensile: "",
    maxFPM: "",
    minBend: "",
    minLoop: "",
    od: "",
    id: "",
    odCalc: "",
  },
  {
    width: "",
    weight: "",
    thickness: "",
    type: "",
    yield: "",
    tensile: "",
    maxFPM: "",
    minBend: "",
    minLoop: "",
    od: "",
    id: "",
    odCalc: "",
  },
  {
    width: "",
    weight: "",
    thickness: "",
    type: "",
    yield: "",
    tensile: "",
    maxFPM: "",
    minBend: "",
    minLoop: "",
    od: "",
    id: "",
    odCalc: "",
  },
  {
    width: "",
    weight: "",
    thickness: "",
    type: "",
    yield: "",
    tensile: "",
    maxFPM: "",
    minBend: "",
    minLoop: "",
    od: "",
    id: "",
    odCalc: "",
  },
];

const summaryLabels = [
  "Maximum Thick",
  "Max @ Full",
  "Minimum Thick",
  "Max @ Width",
];

const instance = axios.create({
  baseURL: "http://127.0.0.1:8000/",
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

interface MaterialSpecsForm {
  referenceNumber: string;
  materialType: string;
  thickness: string;
  width: string;
  yieldStrength: string;
  tensileStrength: string;
  elongation: string;
}

const initialState: MaterialSpecsForm = {
  referenceNumber: localStorage.getItem('performanceReferenceNumber') || "",
  materialType: "",
  thickness: "",
  width: "",
  yieldStrength: "",
  tensileStrength: "",
  elongation: "",
};

const MaterialSpecs = () => {
  const [form, setForm] = useState<MaterialSpecsForm>(initialState);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState("");

  const sendMaterialSpecs = async () => {
    if (!form.referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    
    setIsLoading(true);
    try {
      await instance.post(`/material-specs/${form.referenceNumber}`, form);
      setStatus("Material specs sent successfully!");
    } catch (error) {
      console.error('Error sending material specs:', error);
      setStatus("Failed to send material specs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await instance.post('/material-specs', form);
      setStatus("Material specs saved successfully!");
    } catch (error) {
      console.error('Error saving material specs:', error);
      setStatus("Failed to save material specs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 1200, margin: '0 auto', fontSize: 14, padding: '24px' }}>
      <Text as="h2" className="text-center my-8 text-2xl font-semibold">Material Specifications</Text>
      
      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Reference Information</Text>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <Input 
            label="Reference Number" 
            name="referenceNumber" 
            value={form.referenceNumber} 
            onChange={handleChange}
          />
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px' }}>
            <Button 
              as="button" 
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                sendMaterialSpecs();
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

      <Card className="mb-8 p-6">
        <Text as="h3" className="mb-4 text-lg font-medium">Material Specifications</Text>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          <Input 
            label="Material Type" 
            name="materialType" 
            value={form.materialType}
            onChange={handleChange}
          />
          <Input 
            label="Thickness (in)" 
            name="thickness" 
            type="number" 
            value={form.thickness}
            onChange={handleChange}
          />
          <Input 
            label="Width (in)" 
            name="width" 
            type="number" 
            value={form.width}
            onChange={handleChange}
          />
          <Input 
            label="Yield Strength (PSI)" 
            name="yieldStrength" 
            type="number" 
            value={form.yieldStrength}
            onChange={handleChange}
          />
          <Input 
            label="Tensile Strength (PSI)" 
            name="tensileStrength" 
            type="number" 
            value={form.tensileStrength}
            onChange={handleChange}
          />
          <Input 
            label="Elongation (%)" 
            name="elongation" 
            type="number" 
            value={form.elongation}
            onChange={handleChange}
          />
        </div>
      </Card>

      <div style={{ margin: '32px 0', textAlign: 'center' }}>
        <Button as="button" type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Material Specs'}
        </Button>
      </div>
    </form>
  );
};

export default MaterialSpecs; 