import { useState } from 'react';
import { pythonInstance } from '@/utils';

export interface TDDBHDFormData {
  customer: string;
  date: string;
  referenceNumber: string;
  reelSpecs: {
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
  coilBrakeSpecs: {
    coilWeight: string;
    coilOD: string;
    dispReel: string;
    webTension: string;
    webTension2: string;
    brakePadDiameter: string;
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
  resultsTable: Array<{
    config: string;
    torque: number;
    passed: string;
    width: number;
    matlRequired: number;
    psi: number;
    torqueRequired: number;
  }>;
  confirmedMinWidthOK: boolean;
}

const requiredFields = ["customer", "date", "referenceNumber"];

export const useCreateTDDBHD = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const validate = (form: TDDBHDFormData) => {
    const newErrors: Record<string, boolean> = {};
    requiredFields.forEach((field) => {
      if (!form[field as keyof TDDBHDFormData]) {
        newErrors[field] = true;
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const createTDDBHD = async (form: TDDBHDFormData) => {
    if (!form.referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    setIsLoading(true);
    try {
      if (!validate(form)) {
        setStatus("Please fill all required fields before sending.");
        return;
      }
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => {
        if (typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else {
          formData.append(key, String(value));
        }
      });
      const response = await pythonInstance.post(`/tddbhd/${form.referenceNumber}`, formData);
      if (response.data) {
        setStatus(`TD/DB/HD report created successfully! Reference: ${form.referenceNumber}`);
      } else {
        setStatus("TD/DB/HD report created successfully!");
      }
    } catch (error: any) {
      console.error('Error creating TD/DB/HD report:', error);
      if (error.code === 'ECONNABORTED') {
        setStatus('Request timed out. Please check your connection and try again.');
      } else if (!error.response) {
        setStatus('Network error: Unable to connect to the server. Please check if the server is running.');
      } else if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data)
          : error.response.data;
        setStatus(`Failed to create TD/DB/HD report: ${errorMessage}`);
      } else if (error.message) {
        setStatus(`Failed to create TD/DB/HD report: ${error.message}`);
      } else {
        setStatus("Failed to create TD/DB/HD report. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    errors,
    createTDDBHD,
    validate
  };
}; 