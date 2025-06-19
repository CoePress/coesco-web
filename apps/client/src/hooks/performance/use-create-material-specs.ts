import { useState } from 'react';
import { pythonInstance } from '@/utils';

export interface MaterialSpecsFormData {
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
}

export const useCreateMaterialSpecs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Partial<MaterialSpecsFormData>>({});

  const createMaterialSpecs = async (data: MaterialSpecsFormData) => {
    setIsLoading(true);
    setStatus('');
    setErrors({});

    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response = await pythonInstance.post(`/material-specs/${data.referenceNumber}`, formData);
      setStatus('Material specs created successfully!');
      return response.data;
    } catch (error: any) {
      console.error('Error creating material specs:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      setStatus('Failed to create material specs. Please try again.');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    errors,
    createMaterialSpecs,
  };
}; 