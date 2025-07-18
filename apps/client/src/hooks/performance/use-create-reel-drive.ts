import { useState } from 'react';
import { pythonInstance } from '@/utils';

export interface ReelDriveFormData {
  [key: string]: any;
}

export const useCreateReelDrive = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const createReelDrive = async (formData: ReelDriveFormData) => {
    if (!formData.referenceNumber) {
      setStatus('Please enter a reference number');
      return;
    }
    setIsLoading(true);
    try {
      const response = await pythonInstance.post(`/reel-drive/${formData.referenceNumber}`, formData);
      setStatus('Reel Drive data saved to backend!');
      return response.data;
    } catch (error: any) {
      setStatus('Failed to save Reel Drive data.');
      setErrors({ general: true });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return { isLoading, status, errors, createReelDrive };
}; 