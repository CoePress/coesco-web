import { useState } from 'react';
import { pythonInstance } from '@/utils';

export interface MaterialSpecsFormData {
  referenceNumber: string;
  materialType?: string;
  thickness?: number;
  width?: number;
  yieldStrength?: number;
  tensileStrength?: number;
  customer?: string;
  date?: string;
  coilWeight?: number;
  minBendRad?: number;
  minLoopLength?: number;
  coilOD?: number;
  coilID?: number;
  coilODCaclculated?: number;
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

export interface VariantCalculationPayload {
  material_type: string;
  material_thickness: number;
  yield_strength: number;
  material_width: number;
  coil_weight_max: number;
  coil_id: number;
}

export const calculateMaterialSpecs = async (data: MaterialSpecsFormData) => {
  try {
    const response = await pythonInstance.post('/material_specs/calculate', data);
    return response.data;
  } catch (error: any) {
    console.error('Error calculating material specs:', error);
    throw error;
  }
};

export const calculateMaterialSpecsVariant = async (payload: VariantCalculationPayload) => {
  try {
    const response = await pythonInstance.post('/material_specs/calculate_variant', payload);
    return response.data;
  } catch (error: any) {
    console.error('Error calculating material specs variant:', error);
    throw error;
  }
};

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

      const response = await pythonInstance.post(`/material_specs/${data.referenceNumber}`, formData);
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

  const updateMaterialSpecs = async (referenceNumber: string, data: MaterialSpecsFormData) => {
    if (!referenceNumber) return 'No reference number';
    setIsLoading(true);
    setStatus('');
    setErrors({});
    
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        // Only exclude truly empty values, but include false and 0
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, String(value));
        }
      });
      
      // Use PATCH method for updating to indicate partial update/merge
      const response = await pythonInstance.patch(`/material_specs/${referenceNumber}`, formData);
      setStatus('Material specs updated successfully!');
      return response.data;
    } catch (error: any) {
      console.error('Error updating material specs:', error);
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      }
      setStatus('Failed to update material specs. Please try again.');
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
    updateMaterialSpecs,
    calculateMaterialSpecs,
    calculateMaterialSpecsVariant,
  };
}; 