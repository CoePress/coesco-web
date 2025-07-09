import { useState } from 'react';
import { pythonInstance } from '@/utils';
import { MaterialSpecsFormData } from './use-create-material-specs';

export const useGetMaterialSpecs = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [fetchedMaterialSpecs, setFetchedMaterialSpecs] = useState<MaterialSpecsFormData | null>(null);

  const getMaterialSpecs = async (referenceNumber: string) => {
    if (!referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    
    setIsLoading(true);
    setStatus('');
    try {
      const response = await pythonInstance.get(`/material_specs/${referenceNumber}`);
      if (response.data) {
        // If the response is an object keyed by reference number, extract the value
        const data = response.data[referenceNumber] ? response.data[referenceNumber] : response.data;
        setFetchedMaterialSpecs(data);
        setStatus(`Material specs retrieved successfully for reference: ${referenceNumber}`);
      } else {
        setStatus("No material specs found for this reference number.");
      }
    } catch (error: any) {
      if (error.code === 'ECONNABORTED') {
        setStatus('Request timed out. Please check your connection and try again.');
      } else if (!error.response) {
        setStatus('Network error: Unable to connect to the server. Please check if the server is running.');
      } else if (error.response?.status === 404) {
        setStatus('No material specs found for this reference number.');
      } else if (error.response?.data) {
        const errorMessage = typeof error.response.data === 'object' 
          ? JSON.stringify(error.response.data)
          : error.response.data;
        setStatus(`Failed to get material specs: ${errorMessage}`);
      } else if (error.message) {
        setStatus(`Failed to get material specs: ${error.message}`);
      } else {
        setStatus("Failed to get material specs. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    status,
    fetchedMaterialSpecs,
    getMaterialSpecs,
  };
}; 